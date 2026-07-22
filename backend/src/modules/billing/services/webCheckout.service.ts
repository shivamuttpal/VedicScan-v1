/**
 * Web Checkout Service — Stripe rail for the browser.
 *
 * ─── Why this lives in the billing module ─────────────────────────────────────
 * Web and mobile must grant IDENTICAL entitlements, so both rails write to the
 * same `UserSubscription` / `Purchase` models and are read by the same
 * `EntitlementService`. A user who subscribes on the website and then signs in
 * on Android gets their features immediately, and vice versa, because there is
 * only one notion of "what this account is entitled to".
 *
 * The previous implementation wrote to a separate `UserUsage` document that the
 * entitlement engine never read — so a web payment granted no in-app access at
 * all. Keeping both rails on one model is what prevents that class of drift.
 *
 * ─── Division of responsibility ───────────────────────────────────────────────
 *   Stripe      → charges the card, owns the payment lifecycle for web.
 *   RevenueCat  → charges via Play/App Store, owns the mobile lifecycle.
 *   This module → the single writer of entitlement state for BOTH.
 *
 * Prices still come from the MongoDB plan catalogue, so web and mobile paywalls
 * cannot disagree about what a plan costs.
 */

import mongoose from 'mongoose';
import { planRepository, subscriptionRepository, purchaseRepository } from '../repositories';
import { paymentService } from '../../subscription/services/payment.service';
import { endOfBillingDay } from '../utils/period.util';
import { User } from '../../user/model/user.model';
import type { ISubscriptionPlan, IPlanPrice, SubscriptionStatus } from '../models';
import { PurchaseHistory } from '../models';

/** Fallback subscription lengths when Stripe does not report a period end. */
const INTERVAL_DAYS: Record<string, number> = {
  monthly: 30,
  yearly: 365,
};

export class WebCheckoutError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = 'WebCheckoutError';
  }
}

class WebCheckoutService {
  /**
   * Create a Stripe Checkout Session for a plan from the database catalogue.
   *
   * The amount is ALWAYS read from the plan document server-side. The client
   * sends only a plan code and region — never a price — so a tampered request
   * cannot buy a ₹2,499 plan for ₹1.
   */
  async createCheckoutSession(params: {
    userId: string;
    email?: string;
    planCode: string;
    region?: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const plan = await planRepository.findByCode(params.planCode);

    if (!plan || !plan.isActive) {
      throw new WebCheckoutError('That plan is not available.', 404);
    }

    // The free plan is the default entitlement — there is nothing to charge for.
    const price = this.resolvePrice(plan, params.region);
    if (!price || price.amountMinor <= 0) {
      throw new WebCheckoutError('That plan cannot be purchased.', 400);
    }

    const isOneTime = plan.kind === 'one_time';

    const session = await paymentService.createCheckoutSession({
      userId: params.userId,
      email: params.email,
      amount: price.amountMinor,
      currency: price.currency,
      plan: plan.code,
      // The legacy Stripe helper speaks 'monthly' | 'annual' | 'none'.
      billingCycle: isOneTime ? 'none' : plan.billingInterval === 'yearly' ? 'annual' : 'monthly',
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      isOneTime,
    });

    return {
      sessionId: session.id,
      url: session.url,
      plan: {
        code: plan.code,
        displayName: plan.displayName,
        amount: price.amountMinor / 100,
        currency: price.currency,
      },
    };
  }

  /**
   * Grant entitlements after Stripe confirms payment.
   *
   * Idempotent on `stripeEventId`: Stripe retries webhooks, so the same event
   * will arrive more than once in normal operation. The ledger check below makes
   * a replay a no-op rather than a second grant.
   */
  async grantFromStripe(params: {
    userId: string;
    planCode: string;
    stripeEventId: string;
    stripeSubscriptionId?: string;
    amountMinor?: number;
    currency?: string;
    /** Period end reported by Stripe, when available. */
    periodEnd?: Date | null;
    occurredAt?: Date;
    isRenewal?: boolean;
  }): Promise<string> {
    const plan = await planRepository.findByCode(params.planCode);

    if (!plan) {
      // Same policy as the RevenueCat rail: never guess a tier from a name.
      throw new Error(`[WebCheckout] No plan matches code "${params.planCode}"`);
    }

    // ── Idempotency guard ──
    const alreadyApplied = await PurchaseHistory.findOne({
      'metadata.stripeEventId': params.stripeEventId,
    })
      .select('_id')
      .exec();

    if (alreadyApplied) return 'duplicate_ignored';

    const userObjectId = new mongoose.Types.ObjectId(params.userId);
    const occurredAt = params.occurredAt ?? new Date();

    if (plan.kind === 'one_time') {
      return this.grantOneTime(plan, userObjectId, params, occurredAt);
    }

    return this.grantSubscription(plan, userObjectId, params, occurredAt);
  }

  /** Activate or renew a recurring web subscription. */
  private async grantSubscription(
    plan: ISubscriptionPlan,
    userObjectId: mongoose.Types.ObjectId,
    params: {
      userId: string;
      stripeEventId: string;
      stripeSubscriptionId?: string;
      amountMinor?: number;
      currency?: string;
      periodEnd?: Date | null;
      isRenewal?: boolean;
    },
    occurredAt: Date
  ): Promise<string> {
    const existing = await subscriptionRepository.findByUserId(params.userId);

    // Renewing before the current period ends must EXTEND from the existing
    // expiry, not from now — otherwise the user silently loses the days they
    // already paid for.
    const now = occurredAt;
    const base =
      existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;

    const expiresAt =
      params.periodEnd ??
      new Date(base.getTime() + (INTERVAL_DAYS[plan.billingInterval] ?? 30) * 864e5);

    const status: SubscriptionStatus = 'active';

    const updated = await subscriptionRepository.upsertFromEvent(
      params.userId,
      occurredAt.getTime(),
      {
        planCode: plan.code,
        status,
        productId: plan.code,
        platform: 'stripe',
        startedAt: existing?.startedAt ?? now,
        expiresAt,
        renewsAt: expiresAt,
        cancelledAt: null,
        willRenew: true,
        isInGracePeriod: false,
        lastEventType: params.isRenewal ? 'STRIPE_RENEWAL' : 'STRIPE_INITIAL_PURCHASE',
        metadata: params.stripeSubscriptionId
          ? { stripeSubscriptionId: params.stripeSubscriptionId }
          : {},
      }
    );

    // A null result means a newer event already applied — e.g. the user
    // resubscribed on mobile while this Stripe retry was in flight.
    if (!updated) return 'stale_event_skipped';

    await User.updateOne({ _id: userObjectId }, { $set: { isSubscriber: true } }).exec();

    await purchaseRepository.appendHistory({
      userId: userObjectId,
      entryType: params.isRenewal ? 'renewal' : 'initial_purchase',
      planCode: plan.code,
      planDisplayName: plan.displayName,
      productId: plan.code,
      platform: 'stripe',
      amountMinor: params.amountMinor,
      currency: params.currency,
      periodStart: now,
      periodEnd: expiresAt,
      occurredAt,
      metadata: {
        stripeEventId: params.stripeEventId,
        stripeSubscriptionId: params.stripeSubscriptionId,
      },
    });

    return `activated:${plan.code}`;
  }

  /** Grant a one-time pack bought on the web. */
  private async grantOneTime(
    plan: ISubscriptionPlan,
    userObjectId: mongoose.Types.ObjectId,
    params: {
      stripeEventId: string;
      amountMinor?: number;
      currency?: string;
    },
    occurredAt: Date
  ): Promise<string> {
    // Same expiry rule as the mobile rail — the pack dies at the billing-day
    // boundary, not 24 hours after purchase.
    const expiresAt = plan.expiresAtEndOfPurchaseDay
      ? endOfBillingDay(occurredAt)
      : new Date(occurredAt.getTime() + (plan.validForHours ?? 24) * 3600_000);

    const created = await purchaseRepository.createIfNew({
      userId: userObjectId,
      planCode: plan.code,
      // Stripe event id doubles as the unique transaction key for this rail.
      transactionId: `stripe_${params.stripeEventId}`,
      productId: plan.code,
      platform: 'stripe',
      grants: plan.entitlements.map((ent) => ({
        featureKey: ent.featureKey,
        granted: ent.limit,
        remaining: ent.limit,
      })),
      purchasedAt: occurredAt,
      expiresAt,
      amountMinor: params.amountMinor,
      currency: params.currency,
    });

    if (!created) return 'duplicate_purchase_ignored';

    await purchaseRepository.appendHistory({
      userId: userObjectId,
      entryType: 'one_time_purchase',
      planCode: plan.code,
      planDisplayName: plan.displayName,
      productId: plan.code,
      platform: 'stripe',
      amountMinor: params.amountMinor,
      currency: params.currency,
      occurredAt,
      metadata: { stripeEventId: params.stripeEventId },
    });

    return `addon_granted:${plan.code}`;
  }

  /** Revoke access when a Stripe subscription is cancelled or refunded. */
  async revokeFromStripe(params: {
    userId: string;
    stripeEventId: string;
    reason: 'cancelled' | 'expired' | 'refunded';
    occurredAt?: Date;
  }): Promise<string> {
    const occurredAt = params.occurredAt ?? new Date();

    // `cancelled` keeps access until the paid period ends, matching the mobile
    // rail. Only `expired` and `refunded` remove the plan immediately.
    const status: SubscriptionStatus =
      params.reason === 'cancelled' ? 'cancelled' : params.reason === 'refunded' ? 'refunded' : 'expired';

    const updated = await subscriptionRepository.upsertFromEvent(
      params.userId,
      occurredAt.getTime(),
      {
        status,
        willRenew: false,
        cancelledAt: params.reason === 'cancelled' ? occurredAt : undefined,
        ...(params.reason === 'cancelled' ? {} : { planCode: null }),
        lastEventType: `STRIPE_${params.reason.toUpperCase()}`,
      }
    );

    if (!updated) return 'stale_event_skipped';

    if (params.reason !== 'cancelled') {
      await User.updateOne(
        { _id: new mongoose.Types.ObjectId(params.userId) },
        { $set: { isSubscriber: false } }
      ).exec();
    }

    return params.reason;
  }

  /** Region-scoped price with DEFAULT (rest-of-world) fallback. */
  private resolvePrice(plan: ISubscriptionPlan, region?: string): IPlanPrice | null {
    const normalized = (region || 'DEFAULT').toUpperCase();
    return (
      plan.prices.find((p) => p.region === normalized) ??
      plan.prices.find((p) => p.region === 'DEFAULT') ??
      null
    );
  }
}

export const webCheckoutService = new WebCheckoutService();
