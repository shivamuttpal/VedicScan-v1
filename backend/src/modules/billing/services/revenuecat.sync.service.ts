/**
 * RevenueCat Sync Service
 *
 * Translates RevenueCat state — delivered by webhook or pulled over REST — into
 * our MongoDB projection. This is the only writer of subscription and add-on
 * state, so every path into "user is premium" is funnelled through code that has
 * verified the claim with RevenueCat first.
 *
 * ─── Two entry points, one mapping ────────────────────────────────────────────
 *   • `handleWebhookEvent()` — push. Authoritative and immediate.
 *   • `syncFromRevenueCat()` — pull. Used after a purchase/restore on device and
 *     by the reconciliation cron, covering webhook loss or sandbox delay.
 *
 * Both converge on the same store→plan mapping, so the two paths can never
 * disagree about what a product grants.
 */

import mongoose from 'mongoose';
import { planRepository, subscriptionRepository, purchaseRepository, revenueCatEventRepository } from '../repositories';
import { revenueCatClient, RCSubscriber } from './revenuecat.client';
import { revenueCatConfig } from '../config/billing.config';
import { endOfBillingDay } from '../utils/period.util';
import { User } from '../../user/model/user.model';
import config from '../../../config';
import type {
  ISubscriptionPlan,
  StorePlatform,
  SubscriptionStatus,
  LedgerEntryType,
} from '../models';

/** RevenueCat webhook payload, narrowed to the fields we consume. */
export interface RevenueCatWebhookEvent {
  id: string;
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[] | null;
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  event_timestamp_ms: number;
  store?: string;
  environment?: string;
  cancel_reason?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  price_in_purchased_currency?: number;
  currency?: string;
  is_trial_period?: boolean;
  grace_period_expiration_at_ms?: number | null;
  transferred_from?: string[];
  transferred_to?: string[];
}

/**
 * Outcome of processing one event.
 *
 * The handlers below RETURN this rather than writing event status themselves.
 * Having exactly one writer (`handleWebhookEvent`) is deliberate: when both a
 * handler and its caller could persist status, the caller's write silently
 * overwrote the handler's — which once caused unmapped products to be recorded
 * as `processed` and never retried.
 */
interface EventOutcome {
  status: 'processed' | 'ignored' | 'failed';
  note: string;
}

const processed = (note: string): EventOutcome => ({ status: 'processed', note });
const ignored = (note: string): EventOutcome => ({ status: 'ignored', note });
const failed = (note: string): EventOutcome => ({ status: 'failed', note });

/** Events that establish or continue paid access. */
const ACCESS_GRANTING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
]);

/** Maps RevenueCat's store identifiers onto our platform enum. */
const STORE_TO_PLATFORM: Record<string, StorePlatform> = {
  PLAY_STORE: 'play_store',
  APP_STORE: 'app_store',
  MAC_APP_STORE: 'app_store',
  STRIPE: 'stripe',
  RC_BILLING: 'web',
  PADDLE: 'web',
  PROMOTIONAL: 'promotional',
};

/** Maps webhook event types onto billing-ledger entry types. */
const EVENT_TO_LEDGER_ENTRY: Record<string, LedgerEntryType> = {
  INITIAL_PURCHASE: 'initial_purchase',
  RENEWAL: 'renewal',
  PRODUCT_CHANGE: 'product_change',
  NON_RENEWING_PURCHASE: 'one_time_purchase',
  CANCELLATION: 'cancellation',
  EXPIRATION: 'expiration',
  TRANSFER: 'transfer',
};

class RevenueCatSyncService {
  // ─── Webhook path ──────────────────────────────────────────────────────────

  /**
   * Process one webhook event, exactly once.
   *
   * Returns a short status string used only for logging; the controller always
   * responds 200 to RevenueCat unless the event could not be claimed, because
   * a non-2xx triggers retries that would not help for a logic bug.
   *
   * @param reprocess  Set by the retry cron for an event already in the log.
   *                   The idempotency claim MUST be skipped in that case —
   *                   otherwise the claim hits the existing row, returns
   *                   `duplicate_ignored`, and the retry silently does nothing
   *                   while reporting success. That would permanently strand
   *                   any purchase whose SKU was mapped after the fact.
   */
  async handleWebhookEvent(
    event: RevenueCatWebhookEvent,
    reprocess = false
  ): Promise<string> {
    if (!reprocess) {
      // ── Idempotency claim, before any state change ──
      const claimed = await revenueCatEventRepository.claim({
        eventId: event.id,
        eventType: event.type,
        appUserId: event.app_user_id,
        productId: event.product_id,
        entitlementIds: event.entitlement_ids ?? [],
        store: event.store,
        environment: event.environment,
        eventTimestampMs: event.event_timestamp_ms,
        rawPayload: event as unknown as Record<string, unknown>,
      });

      if (!claimed) return 'duplicate_ignored';
    }

    try {
      // ── Sandbox isolation ──
      // Sandbox purchases are free. Honouring them in production would let
      // anyone with a test account mint unlimited premium access.
      if (
        event.environment === 'SANDBOX' &&
        config.env === 'production' &&
        !revenueCatConfig.allowSandbox
      ) {
        return this.persist(event.id, ignored('Sandbox event rejected in production'));
      }

      if (event.type === 'TEST') {
        return this.persist(event.id, ignored('RevenueCat test event'));
      }

      const userId = await this.resolveUserId(event.app_user_id);
      if (!userId) {
        // Anonymous RevenueCat IDs appear when a purchase happens before login.
        // The client's post-login sync will reconcile it, so this is not an error.
        return this.persist(
          event.id,
          ignored(`No local user for app_user_id "${event.app_user_id}"`)
        );
      }

      const outcome = await this.applyEvent(event, userId);
      return this.persist(event.id, outcome, userId);
    } catch (err: any) {
      // Marked failed so the retry cron can pick it up after the bug is fixed.
      await revenueCatEventRepository.markFailed(event.id, err?.message ?? 'Unknown error');
      throw err;
    }
  }

  /**
   * The ONLY place event status is persisted. Keeping a single writer prevents
   * a handler's status from being silently overwritten by its caller.
   */
  private async persist(
    eventId: string,
    outcome: EventOutcome,
    userId?: mongoose.Types.ObjectId
  ): Promise<string> {
    switch (outcome.status) {
      case 'processed':
        await revenueCatEventRepository.markProcessed(eventId, userId, outcome.note);
        break;
      case 'ignored':
        await revenueCatEventRepository.markIgnored(eventId, outcome.note);
        break;
      case 'failed':
        // Left for the retry cron — typically an unmapped SKU awaiting an
        // operator adding it to a plan's storeProductIds.
        await revenueCatEventRepository.markFailed(eventId, outcome.note);
        break;
    }
    return outcome.note;
  }

  /** Dispatch an event to the right state transition. */
  private async applyEvent(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId
  ): Promise<EventOutcome> {
    const platform = STORE_TO_PLATFORM[event.store ?? ''] ?? 'unknown';

    // ── One-time consumable (Add-on Pack) ──
    if (event.type === 'NON_RENEWING_PURCHASE') {
      return this.applyOneTimePurchase(event, userId, platform);
    }

    // ── Refund / revocation ──
    if (event.type === 'REFUND' || event.cancel_reason === 'CUSTOMER_SUPPORT') {
      return this.applyRefund(event, userId, platform);
    }

    // ── Ownership moved between accounts ──
    if (event.type === 'TRANSFER') {
      return this.applyTransfer(event, userId, platform);
    }

    // ── Terminal loss of access ──
    if (event.type === 'EXPIRATION') {
      await subscriptionRepository.upsertFromEvent(userId.toString(), event.event_timestamp_ms, {
        status: 'expired',
        planCode: null,
        willRenew: false,
        isInGracePeriod: false,
        lastEventType: event.type,
      });
      await this.setSubscriberFlag(userId, false);
      await this.appendLedger(event, userId, platform, null);
      return processed('expired');
    }

    // ── Auto-renew disabled: access CONTINUES until the paid period ends ──
    // Revoking here would take away time the user already paid for.
    if (event.type === 'CANCELLATION') {
      await subscriptionRepository.upsertFromEvent(userId.toString(), event.event_timestamp_ms, {
        status: 'cancelled',
        willRenew: false,
        cancelledAt: new Date(event.event_timestamp_ms),
        lastEventType: event.type,
      });
      await this.appendLedger(event, userId, platform, null);
      return processed('cancelled_access_retained');
    }

    // ── Payment failing: grace period, access retained ──
    if (event.type === 'BILLING_ISSUE') {
      await subscriptionRepository.upsertFromEvent(userId.toString(), event.event_timestamp_ms, {
        status: 'in_billing_retry',
        isInGracePeriod: true,
        expiresAt: event.grace_period_expiration_at_ms
          ? new Date(event.grace_period_expiration_at_ms)
          : undefined,
        lastEventType: event.type,
      });
      return processed('billing_retry');
    }

    if (event.type === 'SUBSCRIPTION_PAUSED') {
      await subscriptionRepository.upsertFromEvent(userId.toString(), event.event_timestamp_ms, {
        status: 'paused',
        willRenew: false,
        lastEventType: event.type,
      });
      await this.setSubscriberFlag(userId, false);
      return processed('paused');
    }

    if (ACCESS_GRANTING_EVENTS.has(event.type)) {
      return this.applyActivation(event, userId, platform);
    }

    return ignored(`Unhandled event type: ${event.type}`);
  }

  /** Activate or renew a recurring subscription. */
  private async applyActivation(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId,
    platform: StorePlatform
  ): Promise<EventOutcome> {
    const plan = await planRepository.findByStoreProductId(
      event.product_id,
      event.entitlement_ids ?? []
    );

    if (!plan) {
      // Fail loudly rather than guessing. Inferring a tier from a product name
      // is how users end up on the wrong plan. Recorded as `failed` so the retry
      // cron replays it automatically once an operator maps the SKU — the user
      // gets their entitlement with no manual intervention.
      return failed(
        `No plan mapped to product "${event.product_id}" / entitlements [${(event.entitlement_ids ?? []).join(', ')}]`
      );
    }

    const isTrial = Boolean(event.is_trial_period) || event.period_type === 'TRIAL';
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

    const status: SubscriptionStatus = event.grace_period_expiration_at_ms
      ? 'in_grace_period'
      : 'active';

    const updated = await subscriptionRepository.upsertFromEvent(
      userId.toString(),
      event.event_timestamp_ms,
      {
        planCode: plan.code,
        status,
        revenueCatCustomerId: event.app_user_id,
        entitlementId: plan.revenueCatEntitlementId ?? (event.entitlement_ids ?? [])[0],
        productId: event.product_id,
        platform,
        startedAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date(),
        expiresAt,
        renewsAt: expiresAt,
        cancelledAt: null,
        willRenew: true,
        isInGracePeriod: Boolean(event.grace_period_expiration_at_ms),
        isTrial,
        trialEndsAt: isTrial ? expiresAt : null,
        lastEventType: event.type,
      }
    );

    if (!updated) return ignored('Stale event skipped (out-of-order delivery)');

    await this.setSubscriberFlag(userId, true);
    await this.appendLedger(event, userId, platform, plan);

    return processed(`activated:${plan.code}`);
  }

  /**
   * Grant an Add-on Pack.
   *
   * The pack's grants and expiry are read from the plan document, so changing
   * what a pack contains — or how long it lasts — is a database edit.
   */
  private async applyOneTimePurchase(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId,
    platform: StorePlatform
  ): Promise<EventOutcome> {
    const plan = await planRepository.findByStoreProductId(
      event.product_id,
      event.entitlement_ids ?? []
    );

    if (!plan || plan.kind !== 'one_time') {
      return failed(`No one-time plan mapped to product "${event.product_id}"`);
    }

    const purchasedAt = event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date();
    const expiresAt = this.computePurchaseExpiry(plan, purchasedAt);

    // Falling back to the event id keeps the unique-index idempotency guarantee
    // even when the store omits a transaction id.
    const transactionId = event.transaction_id || event.original_transaction_id || `rc_evt_${event.id}`;

    const created = await purchaseRepository.createIfNew({
      userId,
      planCode: plan.code,
      transactionId,
      revenueCatEventId: event.id,
      productId: event.product_id,
      platform,
      grants: plan.entitlements.map((ent) => ({
        featureKey: ent.featureKey,
        granted: ent.limit,
        remaining: ent.limit,
      })),
      purchasedAt,
      expiresAt,
      amountMinor: event.price_in_purchased_currency
        ? Math.round(event.price_in_purchased_currency * 100)
        : undefined,
      currency: event.currency,
    });

    if (!created) return ignored('Duplicate store transaction — pack already granted');

    await this.appendLedger(event, userId, platform, plan);
    return processed(`addon_granted:${plan.code}`);
  }

  /**
   * Expiry for a one-time pack.
   *
   * The Add-on Pack is "valid only for the purchase day", so it dies at the next
   * billing-day boundary — NOT 24 hours later. A pack bought at 11pm is
   * therefore valid for one hour, matching the stated terms exactly.
   */
  private computePurchaseExpiry(plan: ISubscriptionPlan, purchasedAt: Date): Date {
    if (plan.expiresAtEndOfPurchaseDay) return endOfBillingDay(purchasedAt);
    if (plan.validForHours && plan.validForHours > 0) {
      return new Date(purchasedAt.getTime() + plan.validForHours * 60 * 60 * 1000);
    }
    // No expiry configured — treat as end of day rather than granting forever.
    return endOfBillingDay(purchasedAt);
  }

  /** Revoke access and void unconsumed add-on units after a refund. */
  private async applyRefund(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId,
    platform: StorePlatform
  ): Promise<EventOutcome> {
    const transactionId = event.transaction_id || event.original_transaction_id;
    if (transactionId) {
      await purchaseRepository.markRefundedByTransaction(transactionId);
    }

    await subscriptionRepository.upsertFromEvent(userId.toString(), event.event_timestamp_ms, {
      status: 'refunded',
      planCode: null,
      willRenew: false,
      lastEventType: event.type,
    });
    await this.setSubscriberFlag(userId, false);

    await purchaseRepository.appendHistory({
      userId,
      entryType: 'refund',
      productId: event.product_id,
      transactionId,
      revenueCatEventId: event.id,
      platform,
      amountMinor: event.price_in_purchased_currency
        ? -Math.round(event.price_in_purchased_currency * 100)
        : undefined,
      currency: event.currency,
      occurredAt: new Date(event.event_timestamp_ms),
    });

    return processed('refunded');
  }

  /**
   * Handle a subscription moving between accounts (family sharing, account
   * switch, reinstall onto a different login).
   *
   * RevenueCat has already decided who owns it; we revoke from the losing
   * accounts and let the winner's own activation event grant access.
   */
  private async applyTransfer(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId,
    platform: StorePlatform
  ): Promise<EventOutcome> {
    for (const fromAppUserId of event.transferred_from ?? []) {
      const fromUserId = await this.resolveUserId(fromAppUserId);
      if (!fromUserId) continue;

      await subscriptionRepository.upsertFromEvent(
        fromUserId.toString(),
        event.event_timestamp_ms,
        {
          status: 'expired',
          planCode: null,
          willRenew: false,
          lastEventType: 'TRANSFER_OUT',
        }
      );
      await this.setSubscriberFlag(fromUserId, false);
    }

    await purchaseRepository.appendHistory({
      userId,
      entryType: 'transfer',
      productId: event.product_id,
      revenueCatEventId: event.id,
      platform,
      occurredAt: new Date(event.event_timestamp_ms),
      metadata: { transferredFrom: event.transferred_from, transferredTo: event.transferred_to },
    });

    // Re-pull the winner's true state rather than inferring it from this event.
    await this.syncFromRevenueCat(userId.toString(), event.app_user_id);
    return processed('transferred');
  }

  // ─── Pull path ─────────────────────────────────────────────────────────────

  /**
   * Re-derive a user's subscription from RevenueCat's REST API.
   *
   * This is what "restore purchases" and post-purchase client sync call. The
   * client tells us *that* something changed; RevenueCat tells us *what*.
   * Nothing from the request body influences the outcome.
   */
  async syncFromRevenueCat(
    userId: string,
    appUserId?: string
  ): Promise<{ synced: boolean; planCode: string | null; status: SubscriptionStatus }> {
    const rcUserId = appUserId || userId;
    const subscriber: RCSubscriber = await revenueCatClient.getSubscriber(rcUserId);
    const now = new Date();
    const active = revenueCatClient.selectActiveEntitlement(subscriber, now);

    // Synthesise a timestamp so pull-sync participates in the same
    // out-of-order protection as webhooks and cannot clobber newer push state.
    const syncTimestampMs = now.getTime();

    if (!active) {
      const existing = await subscriptionRepository.findByUserId(userId);
      // Only downgrade someone who was previously marked active — avoids
      // churning rows for users who have never purchased.
      if (existing && existing.status !== 'none' && existing.status !== 'expired') {
        await subscriptionRepository.upsertFromEvent(userId, syncTimestampMs, {
          status: 'expired',
          planCode: null,
          willRenew: false,
          lastEventType: 'REST_SYNC',
        });
        await this.setSubscriberFlag(new mongoose.Types.ObjectId(userId), false);
      } else {
        await subscriptionRepository.ensureExists(userId);
      }
      return { synced: true, planCode: null, status: 'expired' };
    }

    const productId = active.entitlement.product_identifier;
    const plan = await planRepository.findByStoreProductId(productId, [active.entitlementId]);

    if (!plan) {
      console.error(
        `[RCSync] User ${userId} holds entitlement "${active.entitlementId}" for unmapped product "${productId}".`
      );
      return { synced: false, planCode: null, status: 'none' };
    }

    const rcSubscription = subscriber.subscriptions?.[productId];
    const expiresAt = active.entitlement.expires_date
      ? new Date(active.entitlement.expires_date)
      : null;
    const isInGracePeriod = Boolean(rcSubscription?.grace_period_expires_date);
    const cancelledAt = rcSubscription?.unsubscribe_detected_at
      ? new Date(rcSubscription.unsubscribe_detected_at)
      : null;

    const status: SubscriptionStatus = isInGracePeriod
      ? 'in_grace_period'
      : rcSubscription?.billing_issues_detected_at
        ? 'in_billing_retry'
        : cancelledAt
          ? 'cancelled'
          : 'active';

    await subscriptionRepository.upsertFromEvent(userId, syncTimestampMs, {
      planCode: plan.code,
      status,
      revenueCatCustomerId: rcUserId,
      entitlementId: active.entitlementId,
      productId,
      platform: STORE_TO_PLATFORM[rcSubscription?.store ?? ''] ?? 'unknown',
      startedAt: active.entitlement.purchase_date
        ? new Date(active.entitlement.purchase_date)
        : undefined,
      expiresAt,
      renewsAt: expiresAt,
      cancelledAt,
      willRenew: !cancelledAt,
      isInGracePeriod,
      isTrial: rcSubscription?.period_type === 'trial',
      lastEventType: 'REST_SYNC',
    });

    await this.setSubscriberFlag(new mongoose.Types.ObjectId(userId), true);

    return { synced: true, planCode: plan.code, status };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Map a RevenueCat app_user_id to a local user.
   *
   * The mobile SDK is configured to log in with our Mongo user id, so the happy
   * path is a direct ObjectId match. Anonymous ids ($RCAnonymousID:...) belong to
   * pre-login purchases and resolve to null.
   */
  private async resolveUserId(appUserId: string): Promise<mongoose.Types.ObjectId | null> {
    if (!appUserId || appUserId.startsWith('$RCAnonymousID:')) return null;

    if (mongoose.Types.ObjectId.isValid(appUserId)) {
      const user = await User.findById(appUserId).select('_id').lean().exec();
      if (user) return user._id as mongoose.Types.ObjectId;
    }

    // Fallback: some installs alias by email.
    const byEmail = await User.findOne({ email: appUserId.toLowerCase() }).select('_id').lean().exec();
    return (byEmail?._id as mongoose.Types.ObjectId) ?? null;
  }

  /**
   * Keep the denormalised `User.isSubscriber` flag in step.
   *
   * Retained purely for the existing UI and analytics that read it. It is a
   * convenience mirror, never an authority — all gating reads UserSubscription.
   */
  private async setSubscriberFlag(
    userId: mongoose.Types.ObjectId,
    isSubscriber: boolean
  ): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { isSubscriber } }).exec();
  }

  /** Append a billing-ledger row for a monetary event. */
  private async appendLedger(
    event: RevenueCatWebhookEvent,
    userId: mongoose.Types.ObjectId,
    platform: StorePlatform,
    plan: ISubscriptionPlan | null
  ): Promise<void> {
    const entryType = EVENT_TO_LEDGER_ENTRY[event.type];
    if (!entryType) return;

    await purchaseRepository.appendHistory({
      userId,
      entryType,
      planCode: plan?.code,
      planDisplayName: plan?.displayName,
      productId: event.product_id,
      transactionId: event.transaction_id || event.original_transaction_id,
      revenueCatEventId: event.id,
      platform,
      amountMinor: event.price_in_purchased_currency
        ? Math.round(event.price_in_purchased_currency * 100)
        : undefined,
      currency: event.currency,
      periodStart: event.purchased_at_ms ? new Date(event.purchased_at_ms) : undefined,
      periodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
      occurredAt: new Date(event.event_timestamp_ms),
    });
  }
}

export const revenueCatSyncService = new RevenueCatSyncService();
