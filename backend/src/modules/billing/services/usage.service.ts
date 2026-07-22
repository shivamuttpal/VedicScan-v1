/**
 * Usage Service — the generic quota engine.
 *
 * Completely feature-agnostic: it knows nothing about chat, kundali or
 * compatibility. It reads limits from the resolved entitlements (which come from
 * MongoDB) and enforces them uniformly. Adding a premium feature therefore
 * requires no change to this file.
 *
 * ─── Reserve-then-commit ──────────────────────────────────────────────────────
 * Quota is consumed BEFORE the expensive work runs, not after. If we charged
 * after, a user could fire twenty concurrent requests, all pass the check while
 * none had incremented yet, and burst far past the limit. Reserving up front
 * closes that window.
 *
 * The cost is that failed work would otherwise still be billed, so `consume()`
 * returns a `release()` handle the caller invokes on failure to hand the unit back.
 *
 * ─── Plan units are spent before add-on units ─────────────────────────────────
 * Add-on packs expire at the end of the purchase day while plan quota resets
 * daily or monthly anyway. Spending the plan allowance first means a user who
 * buys a pack keeps its units available for as long as possible instead of
 * burning them while free plan quota sits unused.
 *
 * ─── Two separate ledgers, deliberately ───────────────────────────────────────
 * The UsageCounter meters PLAN-funded consumption ONLY, capped at `planLimit`.
 * Add-on consumption is tracked exclusively by decrementing `grant.remaining` on
 * the Purchase document.
 *
 * This split is not incidental — combining them is subtly wrong. If the counter
 * also metered add-on usage while the effective ceiling were derived from
 * `planLimit + grant.remaining`, then every add-on unit spent would raise `used`
 * by one AND lower the ceiling by one. The two would converge twice as fast as
 * they should and the user would receive roughly half the units they paid for.
 * Keeping the ledgers separate makes each side monotonic and the arithmetic
 * trivially correct.
 */

import { usageRepository, purchaseRepository } from '../repositories';
import { entitlementService, ResolvedEntitlements } from './entitlement.service';
import { getPeriodResetAt } from '../utils/period.util';

/** Why a consumption attempt was refused. */
export type QuotaDenialReason =
  | 'feature_not_in_plan' // plan does not include this capability at all
  | 'quota_exhausted'; // included, but the allowance is spent

export interface ConsumeSuccess {
  allowed: true;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  resetAt: Date | null;
  /**
   * Hands the reserved unit back. Call this — and only this — when the work the
   * quota was reserved for failed. Safe to call once; idempotency is the
   * caller's responsibility.
   */
  release: () => Promise<void>;
}

export interface ConsumeDenial {
  allowed: false;
  reason: QuotaDenialReason;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date | null;
  /** Plan code the user is currently on, for building an upgrade prompt. */
  currentPlan: string;
}

export type ConsumeResult = ConsumeSuccess | ConsumeDenial;

class UsageService {
  /**
   * Reserve `amount` units of `featureKey` for a user.
   *
   * Returns a discriminated union so callers cannot accidentally proceed on a
   * denial — TypeScript forces the `allowed` check before `release` is reachable.
   */
  async consume(
    userId: string,
    featureKey: string,
    amount = 1,
    at: Date = new Date(),
    preResolved?: ResolvedEntitlements
  ): Promise<ConsumeResult> {
    const resolved = preResolved ?? (await entitlementService.resolve(userId, at));
    const entitlement = resolved.features.get(featureKey);

    if (!entitlement) {
      return {
        allowed: false,
        reason: 'feature_not_in_plan',
        used: 0,
        limit: 0,
        remaining: 0,
        resetAt: null,
        currentPlan: resolved.plan.code,
      };
    }

    const resetAt = getPeriodResetAt(entitlement.period, at);

    // ── Unlimited: record for analytics, never gate ──
    if (entitlement.unlimited) {
      const counter = await usageRepository.increment(
        userId,
        featureKey,
        entitlement.period,
        amount,
        at
      );
      return {
        allowed: true,
        used: counter.used,
        limit: -1,
        remaining: Infinity,
        unlimited: true,
        resetAt,
        release: async () => {
          await usageRepository.refund(userId, featureKey, entitlement.period, amount, at);
        },
      };
    }

    // ── Step 1: spend plan quota first (atomic check-and-increment) ──
    const planLimit = Math.max(entitlement.planLimit, 0);

    if (planLimit >= amount) {
      const counter = await usageRepository.incrementIfBelowLimit(
        userId,
        featureKey,
        entitlement.period,
        planLimit,
        amount,
        at
      );

      if (counter) {
        return {
          allowed: true,
          used: counter.used,
          limit: entitlement.totalLimit,
          remaining: planLimit - counter.used + entitlement.addonLimit,
          unlimited: false,
          resetAt,
          release: async () => {
            await usageRepository.refund(userId, featureKey, entitlement.period, amount, at);
          },
        };
      }
    }

    // ── Step 2: plan quota exhausted — fall back to add-on packs ──
    const debited = await this.debitAddons(resolved, featureKey, amount, at);

    if (debited) {
      const counter = await usageRepository.findCounter(userId, featureKey, entitlement.period, at);
      const planUsed = counter?.used ?? planLimit;

      return {
        allowed: true,
        used: planUsed + amount,
        limit: entitlement.totalLimit,
        remaining: Math.max(0, entitlement.addonLimit - amount),
        unlimited: false,
        resetAt,
        release: async () => {
          await purchaseRepository.refundGrant(debited.purchaseId, featureKey, debited.qty);
        },
      };
    }

    // ── Step 3: nothing left in either ledger ──
    const existing = await usageRepository.findCounter(userId, featureKey, entitlement.period, at);
    return {
      allowed: false,
      reason: 'quota_exhausted',
      used: existing?.used ?? planLimit,
      limit: entitlement.totalLimit,
      remaining: 0,
      resetAt,
      currentPlan: resolved.plan.code,
    };
  }

  /**
   * Take `amount` units from the soonest-expiring pack that still has them.
   * Ordering by expiry means the units most at risk of being wasted are used first.
   */
  private async debitAddons(
    resolved: ResolvedEntitlements,
    featureKey: string,
    amount: number,
    at: Date
  ): Promise<{ purchaseId: any; qty: number } | null> {
    for (const purchase of resolved.activePurchases) {
      const grant = purchase.grants.find((g) => g.featureKey === featureKey && g.remaining >= amount);
      if (!grant) continue;

      const updated = await purchaseRepository.consumeGrant(
        purchase._id as any,
        featureKey,
        amount,
        at
      );
      if (updated) return { purchaseId: purchase._id, qty: amount };
    }
    return null;
  }

  /** Read-only check. Does not reserve anything. */
  async peek(userId: string, featureKey: string, at: Date = new Date()) {
    return entitlementService.getQuotaStatus(userId, featureKey, at);
  }

  /** Remove all usage data for a user (account deletion). */
  async purgeUser(userId: string): Promise<void> {
    await Promise.all([
      usageRepository.deleteAllForUser(userId),
      purchaseRepository.deleteAllForUser(userId),
    ]);
  }
}

export const usageService = new UsageService();
