/**
 * Purchase — a one-time consumable grant (the Add-on Pack).
 *
 * Distinct from UserSubscription because the semantics differ fundamentally:
 * a subscription grants a *recurring allowance that resets*, whereas a purchase
 * grants a *fixed bucket of units that depletes and then expires*.
 *
 * A user may hold several concurrently (buy two packs in a day). The entitlement
 * engine sums the remaining units across all unexpired purchases and adds them
 * on top of the plan allowance, so add-ons stack naturally.
 *
 * Expiry is enforced at read time by filtering on `expiresAt > now` — the
 * cleanup cron only marks rows `expired` for reporting hygiene, so a missed
 * cron run can never hand out extra quota.
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { StorePlatform } from './userSubscription.model';

export type PurchaseStatus = 'active' | 'consumed' | 'expired' | 'refunded';

/** Remaining units of one feature within this pack. */
export interface IPurchaseGrant {
  featureKey: string;
  /** Units originally granted. */
  granted: number;
  /** Units still available. Decremented atomically as the user consumes them. */
  remaining: number;
}

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  /** Plan document (kind: 'one_time') this pack was created from. */
  planCode: string;

  /**
   * RevenueCat transaction identifier. Unique — this is the idempotency key
   * that stops a replayed webhook from granting a second pack.
   */
  transactionId: string;
  /** RevenueCat event id that created this row, for audit tracing. */
  revenueCatEventId?: string;
  productId?: string;
  platform: StorePlatform;

  grants: IPurchaseGrant[];

  purchasedAt: Date;
  /** Hard expiry. For the Add-on Pack this is the end of the purchase billing day. */
  expiresAt: Date;
  status: PurchaseStatus;

  /** Price actually recorded at purchase time, for revenue reporting. */
  amountMinor?: number;
  currency?: string;

  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const purchaseGrantSchema = new Schema<IPurchaseGrant>(
  {
    featureKey: { type: String, required: true },
    granted: { type: Number, required: true, min: 0 },
    remaining: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planCode: { type: String, required: true },

    transactionId: { type: String, required: true, unique: true, index: true },
    revenueCatEventId: { type: String, index: true },
    productId: { type: String },
    platform: {
      type: String,
      enum: ['play_store', 'app_store', 'stripe', 'web', 'promotional', 'unknown'],
      default: 'unknown',
    },

    grants: { type: [purchaseGrantSchema], default: [] },

    purchasedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'consumed', 'expired', 'refunded'],
      default: 'active',
      index: true,
    },

    amountMinor: { type: Number },
    currency: { type: String, uppercase: true },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/**
 * Hot path index: "all live add-on grants for this user right now", evaluated on
 * every quota check for a user who owns any pack.
 */
purchaseSchema.index({ userId: 1, status: 1, expiresAt: 1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
