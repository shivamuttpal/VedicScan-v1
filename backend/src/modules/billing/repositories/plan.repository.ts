/**
 * Plan Repository
 *
 * All plan reads go through here so the in-process cache has a single choke
 * point. Plans are read on nearly every premium request but change only when an
 * operator edits them, which makes them an ideal cache candidate.
 *
 * The cache is per-process and TTL-based. With multiple replicas a price change
 * therefore takes up to PLAN_CACHE_TTL_MS to propagate everywhere; that is an
 * accepted trade-off for avoiding a DB round trip per request. Call
 * `invalidate()` after any admin write to make the change immediate locally.
 */

import { SubscriptionPlan, ISubscriptionPlan } from '../models';
import { PLAN_CACHE_TTL_MS } from '../config/billing.config';

interface CacheEntry {
  plans: ISubscriptionPlan[];
  expiresAt: number;
}

let cache: CacheEntry | null = null;

export const planRepository = {
  /**
   * Every active plan, cached. Returns lean-but-hydrated documents so callers
   * may use schema methods such as `priceForRegion()`.
   */
  async findAllActive(): Promise<ISubscriptionPlan[]> {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.plans;

    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 }).exec();

    if (PLAN_CACHE_TTL_MS > 0) {
      cache = { plans, expiresAt: now + PLAN_CACHE_TTL_MS };
    }
    return plans;
  },

  /** Includes inactive plans — used by admin tooling and history rendering. */
  async findAll(): Promise<ISubscriptionPlan[]> {
    return SubscriptionPlan.find().sort({ sortOrder: 1 }).exec();
  },

  /**
   * Look up by plan code. Resolves from cache when the plan is active, and
   * falls back to a direct query so that users who still own a now-inactive
   * plan keep their entitlements.
   */
  async findByCode(code: string): Promise<ISubscriptionPlan | null> {
    const active = await this.findAllActive();
    const hit = active.find((p) => p.code === code);
    if (hit) return hit;
    return SubscriptionPlan.findOne({ code }).exec();
  },

  /**
   * Resolve the plan a store purchase corresponds to.
   *
   * Product ID is matched first because it is unambiguous — it identifies the
   * exact SKU. Entitlement ID is only a fallback, since monthly and yearly
   * variants intentionally share one entitlement and matching on it alone
   * cannot distinguish them.
   */
  async findByStoreProductId(
    productId?: string,
    entitlementIds: string[] = []
  ): Promise<ISubscriptionPlan | null> {
    const plans = await this.findAllActive();

    if (productId) {
      const byProduct = plans.find((p) => p.storeProductIds.includes(productId));
      if (byProduct) return byProduct;
    }

    for (const entId of entitlementIds) {
      const byEntitlement = plans.find((p) => p.revenueCatEntitlementId === entId);
      if (byEntitlement) return byEntitlement;
    }

    // Inactive plans are still honoured for existing owners.
    if (productId) {
      return SubscriptionPlan.findOne({ storeProductIds: productId }).exec();
    }
    return null;
  },

  async create(data: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> {
    const plan = await SubscriptionPlan.create(data);
    this.invalidate();
    return plan;
  },

  async updateByCode(
    code: string,
    update: Partial<ISubscriptionPlan>
  ): Promise<ISubscriptionPlan | null> {
    const plan = await SubscriptionPlan.findOneAndUpdate({ code }, { $set: update }, { new: true }).exec();
    this.invalidate();
    return plan;
  },

  /** Drop the local cache. Call after any write that changes plan data. */
  invalidate(): void {
    cache = null;
  },
};
