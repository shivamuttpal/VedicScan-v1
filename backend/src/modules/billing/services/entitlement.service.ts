/**
 * Entitlement Service
 *
 * Answers the single question the rest of the app cares about:
 * "what is this user allowed to do right now?"
 *
 * ─── Resolution order ─────────────────────────────────────────────────────────
 *   1. Load the user's subscription row (RevenueCat's verified projection).
 *   2. If it does not currently grant access, fall back to the default free plan.
 *   3. Read that plan's entitlements from MongoDB.
 *   4. Layer any live add-on packs on top, summing extra units per feature.
 *
 * Add-ons are ADDITIVE, not replacements: a Standard user with an Add-on Pack
 * gets 11 + 5 = 16 chat sessions today. This falls out of the model rather than
 * needing special cases.
 *
 * Nothing here reads request input. Entitlements are derived solely from stored,
 * server-verified state, which is what makes "never trust the client" hold.
 */

import { planRepository, subscriptionRepository, purchaseRepository, usageRepository } from '../repositories';
import { DEFAULT_PLAN_CODE } from '../config/billing.config';
import { getPeriodResetAt, PeriodType } from '../utils/period.util';
import type { ISubscriptionPlan, IUserSubscription, IPurchase } from '../models';

/** Effective allowance for one feature, after plan + add-ons are combined. */
export interface FeatureEntitlement {
  featureKey: string;
  /** Units from the subscription plan. -1 means unlimited. */
  planLimit: number;
  /** Extra units from unexpired add-on packs. */
  addonLimit: number;
  /** planLimit + addonLimit, or -1 when the plan grants unlimited. */
  totalLimit: number;
  period: PeriodType;
  /** True when the plan grants unlimited use (e.g. Baby Naming on paid plans). */
  unlimited: boolean;
}

/** Complete, resolved billing state for a user at a point in time. */
export interface ResolvedEntitlements {
  userId: string;
  plan: ISubscriptionPlan;
  subscription: IUserSubscription | null;
  /** True when a paid subscription is currently in force. */
  isPremium: boolean;
  /** Live add-on packs contributing extra units. */
  activePurchases: IPurchase[];
  /** Feature key → effective allowance. */
  features: Map<string, FeatureEntitlement>;
}

/** A feature's allowance combined with how much of it is already spent. */
export interface FeatureQuotaStatus extends FeatureEntitlement {
  used: number;
  /** Units left. Infinity when unlimited. */
  remaining: number;
  allowed: boolean;
  resetAt: Date | null;
}

class EntitlementService {
  /**
   * Resolve everything a user is entitled to.
   *
   * Throws if the default plan is missing from the database, because silently
   * granting or denying access on a seeding mistake is worse than a loud failure
   * — the middleware turns this into a 503, not a free upgrade.
   */
  async resolve(userId: string, at: Date = new Date()): Promise<ResolvedEntitlements> {
    const [subscription, activePurchases] = await Promise.all([
      subscriptionRepository.findByUserId(userId),
      purchaseRepository.findActiveForUser(userId, at),
    ]);

    const hasActiveSubscription = Boolean(
      subscription && (subscription as any).isActiveNow?.(at)
    );

    const planCode =
      hasActiveSubscription && subscription?.planCode ? subscription.planCode : DEFAULT_PLAN_CODE;

    let plan = await planRepository.findByCode(planCode);

    // A subscription pointing at a deleted plan must not lock the user out —
    // degrade to free rather than failing the request.
    if (!plan && planCode !== DEFAULT_PLAN_CODE) {
      console.error(
        `[Entitlement] Plan "${planCode}" referenced by user ${userId} not found. Falling back to "${DEFAULT_PLAN_CODE}".`
      );
      plan = await planRepository.findByCode(DEFAULT_PLAN_CODE);
    }

    if (!plan) {
      throw new Error(
        `[Entitlement] Default plan "${DEFAULT_PLAN_CODE}" is missing from the database. Run the plan seeder.`
      );
    }

    const features = this.combine(plan, activePurchases);

    return {
      userId,
      plan,
      subscription,
      isPremium: hasActiveSubscription && plan.kind === 'subscription' && plan.code !== DEFAULT_PLAN_CODE,
      activePurchases,
      features,
    };
  }

  /**
   * Merge plan entitlements with add-on grants into one allowance table.
   *
   * Unlimited (-1) plan limits absorb add-ons — topping up an already-unlimited
   * feature is meaningless, and letting `-1 + 5 = 4` would silently *reduce* the
   * allowance, which is exactly the kind of bug this explicit branch prevents.
   */
  private combine(
    plan: ISubscriptionPlan,
    purchases: IPurchase[]
  ): Map<string, FeatureEntitlement> {
    const features = new Map<string, FeatureEntitlement>();

    for (const ent of plan.entitlements) {
      const unlimited = ent.limit === -1;
      features.set(ent.featureKey, {
        featureKey: ent.featureKey,
        planLimit: ent.limit,
        addonLimit: 0,
        totalLimit: ent.limit,
        period: ent.period,
        unlimited,
      });
    }

    for (const purchase of purchases) {
      for (const grant of purchase.grants) {
        if (grant.remaining <= 0) continue;

        const existing = features.get(grant.featureKey);

        if (!existing) {
          // Add-on grants a feature the base plan does not include at all —
          // e.g. a free user buying a pack. The pack itself is the entitlement.
          features.set(grant.featureKey, {
            featureKey: grant.featureKey,
            planLimit: 0,
            addonLimit: grant.remaining,
            totalLimit: grant.remaining,
            period: 'daily',
            unlimited: false,
          });
          continue;
        }

        if (existing.unlimited) continue;

        existing.addonLimit += grant.remaining;
        existing.totalLimit = existing.planLimit + existing.addonLimit;
      }
    }

    return features;
  }

  /**
   * Allowance plus current consumption for one feature — the read-only check
   * used by the status endpoint and by middleware before reserving quota.
   */
  async getQuotaStatus(
    userId: string,
    featureKey: string,
    at: Date = new Date(),
    preResolved?: ResolvedEntitlements
  ): Promise<FeatureQuotaStatus | null> {
    const resolved = preResolved ?? (await this.resolve(userId, at));
    const entitlement = resolved.features.get(featureKey);

    // Feature absent from the plan means "not included", not "unlimited".
    if (!entitlement) return null;

    if (entitlement.unlimited) {
      return {
        ...entitlement,
        used: 0,
        remaining: Infinity,
        allowed: true,
        resetAt: null,
      };
    }

    const counter = await usageRepository.findCounter(userId, featureKey, entitlement.period, at);

    return {
      ...entitlement,
      ...this.computeUsage(entitlement, counter?.used ?? 0),
      resetAt: getPeriodResetAt(entitlement.period, at),
    };
  }

  /**
   * Convert a plan-funded counter reading into user-facing usage figures.
   *
   * MUST mirror `UsageService.consume()`: the counter meters PLAN consumption
   * only (capped at planLimit), while add-on consumption lives in
   * `grant.remaining` — which `addonLimit` already reflects. Reporting
   * `totalLimit - counterUsed` here would double-count add-on spend and show
   * users a different number from the one being enforced.
   */
  private computeUsage(
    entitlement: FeatureEntitlement,
    planUsed: number
  ): { used: number; remaining: number; allowed: boolean } {
    const planLimit = Math.max(entitlement.planLimit, 0);
    const planRemaining = Math.max(0, planLimit - planUsed);
    const remaining = planRemaining + entitlement.addonLimit;

    return {
      // Derived from remaining so that spending an add-on unit visibly
      // increments `used`, even though it never touches the counter.
      used: Math.max(0, entitlement.totalLimit - remaining),
      remaining,
      allowed: remaining > 0,
    };
  }

  /** Quota status for every feature in the user's plan — powers the status screen. */
  async getAllQuotaStatuses(
    userId: string,
    at: Date = new Date()
  ): Promise<{ resolved: ResolvedEntitlements; quotas: FeatureQuotaStatus[] }> {
    const resolved = await this.resolve(userId, at);
    const entitlements = Array.from(resolved.features.values());

    const counters = await usageRepository.findCountersForFeatures(
      userId,
      entitlements.map((e) => ({ featureKey: e.featureKey, period: e.period })),
      at
    );

    const quotas = entitlements.map((ent) => {
      if (ent.unlimited) {
        return { ...ent, used: 0, remaining: Infinity, allowed: true, resetAt: null };
      }
      return {
        ...ent,
        ...this.computeUsage(ent, counters.get(ent.featureKey)?.used ?? 0),
        resetAt: getPeriodResetAt(ent.period, at),
      };
    });

    return { resolved, quotas };
  }

  /** Convenience predicate for callers that only need a yes/no. */
  async hasFeature(userId: string, featureKey: string, at: Date = new Date()): Promise<boolean> {
    const status = await this.getQuotaStatus(userId, featureKey, at);
    return Boolean(status?.allowed);
  }
}

export const entitlementService = new EntitlementService();
