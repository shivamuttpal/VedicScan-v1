/**
 * Purchase History — the immutable, user-facing billing ledger.
 *
 * Separate from `Purchase` (live consumable state) and `RevenueCatEvent` (raw
 * webhook log) because it answers a different question: "what has this user
 * been charged for, ever?" Rows are append-only and are never mutated after
 * insert — a refund appends a new `refund` row rather than editing the original,
 * so the ledger always reconciles.
 *
 * This is what powers the in-app "Billing history" screen and any finance
 * export, and it survives plan deletions because it stores denormalised copies
 * of the plan name and price at time of purchase.
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { StorePlatform } from './userSubscription.model';

export type LedgerEntryType =
  | 'initial_purchase'
  | 'renewal'
  | 'product_change'
  | 'one_time_purchase'
  | 'cancellation'
  | 'expiration'
  | 'refund'
  | 'transfer'
  | 'trial_start'
  | 'trial_conversion';

export interface IPurchaseHistory extends Document {
  userId: mongoose.Types.ObjectId;
  entryType: LedgerEntryType;

  planCode?: string;
  /** Denormalised so history stays readable if the plan is renamed or removed. */
  planDisplayName?: string;

  productId?: string;
  transactionId?: string;
  revenueCatEventId?: string;
  platform: StorePlatform;

  /** Amount in minor units as reported by the store. Negative for refunds. */
  amountMinor?: number;
  currency?: string;

  /** Subscription window this entry covers, when applicable. */
  periodStart?: Date;
  periodEnd?: Date;

  occurredAt: Date;
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const purchaseHistorySchema = new Schema<IPurchaseHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entryType: {
      type: String,
      enum: [
        'initial_purchase',
        'renewal',
        'product_change',
        'one_time_purchase',
        'cancellation',
        'expiration',
        'refund',
        'transfer',
        'trial_start',
        'trial_conversion',
      ],
      required: true,
    },

    planCode: { type: String },
    planDisplayName: { type: String },

    productId: { type: String },
    transactionId: { type: String, index: true },
    revenueCatEventId: { type: String, index: true },
    platform: {
      type: String,
      enum: ['play_store', 'app_store', 'stripe', 'web', 'promotional', 'unknown'],
      default: 'unknown',
    },

    amountMinor: { type: Number },
    currency: { type: String, uppercase: true },

    periodStart: { type: Date },
    periodEnd: { type: Date },

    occurredAt: { type: Date, required: true, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/** Powers the paginated history endpoint: newest entries for a user first. */
purchaseHistorySchema.index({ userId: 1, occurredAt: -1 });

export const PurchaseHistory = mongoose.model<IPurchaseHistory>(
  'PurchaseHistory',
  purchaseHistorySchema
);
