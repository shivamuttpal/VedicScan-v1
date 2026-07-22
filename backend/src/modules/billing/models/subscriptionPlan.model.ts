/**
 * Subscription Plan (the product catalogue — single source of pricing truth)
 *
 * Every plan, price, currency, limit and store-product mapping lives here in
 * MongoDB. Nothing in this file is hardcoded in application code, so pricing
 * changes, new regions, new plans and limit adjustments are all achieved by
 * updating documents — never by redeploying.
 *
 * ─── Pricing model ────────────────────────────────────────────────────────────
 * `prices[]` is a list of region-scoped entries rather than fixed INR/USD fields.
 * Today we seed `IN` and `DEFAULT` (rest of world); adding `EU`, `US`, `GB` or
 * any other region later requires no schema or code change. Region resolution
 * falls back to the `DEFAULT` entry whenever a user's region has no explicit price.
 *
 * IMPORTANT: on mobile, these prices are *display metadata only*. The amount a
 * user is actually charged is set in the Google Play / App Store console and
 * surfaced through RevenueCat Offerings. Keep them in sync for correct paywall
 * copy, but never treat this value as proof of payment.
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { PeriodType } from '../utils/period.util';

/** Recurring subscriptions renew; one-time packs are consumed and expire. */
export type PlanKind = 'subscription' | 'one_time';

/** Recurrence of a subscription plan. `none` for one-time packs. */
export type BillingInterval = 'monthly' | 'yearly' | 'lifetime' | 'none';

/** A single feature allowance granted by a plan. */
export interface IPlanEntitlement {
  /** References `Feature.key`. */
  featureKey: string;
  /** Units allowed per window. Use -1 for unlimited. */
  limit: number;
  /**
   * Window this allowance resets on. Note that a *yearly* plan still uses
   * `monthly` here for report quotas — that is exactly how yearly subscribers
   * receive fresh limits every month for the life of the subscription.
   */
  period: PeriodType;
}

/** Region-scoped price. `region: 'DEFAULT'` is the rest-of-world fallback. */
export interface IPlanPrice {
  /** ISO-3166 alpha-2 country code, or the literal 'DEFAULT'. */
  region: string;
  /** ISO-4217 currency code, e.g. 'INR', 'USD'. */
  currency: string;
  /**
   * Amount in the currency's MINOR unit (paise, cents) to avoid float drift.
   * ₹299 => 29900. $9 => 900.
   */
  amountMinor: number;
  /** Pre-formatted display string, e.g. '₹299'. Optional; UI may format itself. */
  displayPrice?: string;
}

export interface ISubscriptionPlan extends Document {
  /** Stable machine identifier, e.g. 'standard_monthly'. Never reuse a code. */
  code: string;
  displayName: string;
  description?: string;
  kind: PlanKind;
  billingInterval: BillingInterval;

  /**
   * RevenueCat entitlement identifier that proves ownership of this plan.
   * Multiple plans may share one entitlement (monthly + yearly both grant
   * 'standard_access'); `storeProductIds` then disambiguates which was bought.
   */
  revenueCatEntitlementId?: string;
  /**
   * Store product/SKU identifiers mapped to this plan, across every platform.
   * This is what lets iOS and Web be added later with zero backend changes —
   * you register the new product ID here and the sync layer resolves it.
   */
  storeProductIds: string[];

  entitlements: IPlanEntitlement[];
  prices: IPlanPrice[];

  /**
   * Lifetime of a one-time pack, in hours from purchase. The Add-on Pack uses
   * `validForHours: null` together with `expiresAtEndOfPurchaseDay: true` so it
   * dies at billing-day rollover rather than a rolling 24h later.
   */
  validForHours?: number | null;
  /** One-time packs only: expire at the end of the billing day of purchase. */
  expiresAtEndOfPurchaseDay: boolean;

  /** Hidden plans remain valid for existing owners but are not sold. */
  isActive: boolean;
  /** Ascending sort order for paywall display. */
  sortOrder: number;
  /** Free-form flags for future work (trials, coupons, referrals) without migrations. */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const planEntitlementSchema = new Schema<IPlanEntitlement>(
  {
    featureKey: { type: String, required: true },
    limit: { type: Number, required: true },
    period: {
      type: String,
      enum: ['daily', 'monthly', 'lifetime', 'none'],
      required: true,
    },
  },
  { _id: false }
);

const planPriceSchema = new Schema<IPlanPrice>(
  {
    region: { type: String, required: true, uppercase: true, trim: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
    displayPrice: { type: String, trim: true },
  },
  { _id: false }
);

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    kind: { type: String, enum: ['subscription', 'one_time'], required: true },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime', 'none'],
      required: true,
    },

    revenueCatEntitlementId: { type: String, trim: true, index: true },
    storeProductIds: { type: [String], default: [], index: true },

    entitlements: { type: [planEntitlementSchema], default: [] },
    prices: { type: [planPriceSchema], default: [] },

    validForHours: { type: Number, default: null },
    expiresAtEndOfPurchaseDay: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/**
 * Resolve the price for a region, falling back to the DEFAULT (rest-of-world)
 * entry. Returns null when a plan has no pricing at all (e.g. the free plan may
 * legitimately carry a zero-amount DEFAULT entry instead).
 */
subscriptionPlanSchema.methods.priceForRegion = function (
  this: ISubscriptionPlan,
  region: string
): IPlanPrice | null {
  const normalized = (region || '').toUpperCase();
  return (
    this.prices.find((p) => p.region === normalized) ??
    this.prices.find((p) => p.region === 'DEFAULT') ??
    null
  );
};

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
