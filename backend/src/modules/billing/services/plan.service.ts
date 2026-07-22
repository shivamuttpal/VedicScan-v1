/**
 * Plan Service
 *
 * Shapes the database plan catalogue into the payload the paywall renders.
 * Because everything is read from MongoDB, adding a plan or changing a price is
 * an operational task, not a release.
 */

import { planRepository } from '../repositories';
import { Feature } from '../models';
import type { ISubscriptionPlan, IPlanPrice } from '../models';

/** One plan as exposed to clients. */
export interface PlanDTO {
  code: string;
  displayName: string;
  description?: string;
  kind: string;
  billingInterval: string;
  price: {
    region: string;
    currency: string;
    amountMinor: number;
    /** Convenience decimal — 29900 minor → 299. */
    amount: number;
    displayPrice: string;
  } | null;
  features: Array<{
    featureKey: string;
    displayName: string;
    limit: number;
    period: string;
    unlimited: boolean;
  }>;
  /** Store SKUs the client passes to the RevenueCat SDK. */
  storeProductIds: string[];
  revenueCatEntitlementId?: string;
  sortOrder: number;
  metadata: Record<string, unknown>;
}

class PlanService {
  /**
   * Public catalogue for a region.
   *
   * Region normally comes from the CloudFront/Cloudflare country header, with an
   * explicit `?region=` override for testing. Unknown regions resolve to the
   * plan's DEFAULT price, which is how "rest of world" pricing works without
   * enumerating every country.
   */
  async getCatalogue(region = 'DEFAULT'): Promise<PlanDTO[]> {
    const [plans, featureDocs] = await Promise.all([
      planRepository.findAllActive(),
      Feature.find({ isActive: true }).lean().exec(),
    ]);

    const featureNames = new Map(featureDocs.map((f) => [f.key, f.displayName]));

    return plans.map((plan) => this.toDTO(plan, region, featureNames));
  }

  async getPlanByCode(code: string, region = 'DEFAULT'): Promise<PlanDTO | null> {
    const plan = await planRepository.findByCode(code);
    if (!plan) return null;

    const featureDocs = await Feature.find({ isActive: true }).lean().exec();
    const featureNames = new Map(featureDocs.map((f) => [f.key, f.displayName]));

    return this.toDTO(plan, region, featureNames);
  }

  private toDTO(
    plan: ISubscriptionPlan,
    region: string,
    featureNames: Map<string, string>
  ): PlanDTO {
    const price = this.resolvePrice(plan, region);

    return {
      code: plan.code,
      displayName: plan.displayName,
      description: plan.description,
      kind: plan.kind,
      billingInterval: plan.billingInterval,
      price: price
        ? {
            region: price.region,
            currency: price.currency,
            amountMinor: price.amountMinor,
            amount: price.amountMinor / 100,
            displayPrice: price.displayPrice || this.formatPrice(price),
          }
        : null,
      features: plan.entitlements.map((ent) => ({
        featureKey: ent.featureKey,
        displayName: featureNames.get(ent.featureKey) ?? ent.featureKey,
        limit: ent.limit,
        period: ent.period,
        unlimited: ent.limit === -1,
      })),
      storeProductIds: plan.storeProductIds,
      revenueCatEntitlementId: plan.revenueCatEntitlementId,
      sortOrder: plan.sortOrder,
      metadata: plan.metadata ?? {},
    };
  }

  /** Region-specific price, else the DEFAULT (rest-of-world) entry, else null. */
  private resolvePrice(plan: ISubscriptionPlan, region: string): IPlanPrice | null {
    const normalized = (region || 'DEFAULT').toUpperCase();
    return (
      plan.prices.find((p) => p.region === normalized) ??
      plan.prices.find((p) => p.region === 'DEFAULT') ??
      null
    );
  }

  /** Minimal fallback formatter for plans without an explicit displayPrice. */
  private formatPrice(price: IPlanPrice): string {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[price.currency] ?? `${price.currency} `;
    const amount = price.amountMinor / 100;
    return `${symbol}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
  }
}

export const planService = new PlanService();
