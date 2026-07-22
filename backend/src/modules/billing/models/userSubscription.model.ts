/**
 * User Subscription — the projection of RevenueCat state into our database.
 *
 * ─── Trust model ──────────────────────────────────────────────────────────────
 * This document is a CACHE, never an authority. It is written from exactly two
 * places, both of which have verified the state with RevenueCat first:
 *
 *   1. The RevenueCat webhook (server-to-server, bearer-token authenticated).
 *   2. The sync service, after a `GET /v1/subscribers/:id` REST call.
 *
 * Nothing a client sends can promote a user. The client may only ask us to
 * *re-check* with RevenueCat; the answer always comes from RevenueCat.
 *
 * One document per user (unique index on userId). Historical states are kept in
 * PurchaseHistory / RevenueCatEvent rather than by versioning this row.
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Lifecycle states, mirroring RevenueCat's subscriber semantics.
 * `in_grace_period` and `in_billing_retry` STILL GRANT ACCESS — the store is
 * retrying payment and revoking early would punish users for a card hiccup.
 */
export type SubscriptionStatus =
  | 'active'
  | 'in_grace_period'
  | 'in_billing_retry'
  | 'cancelled' // cancelled but not yet expired — access continues until expiresAt
  | 'expired'
  | 'paused'
  | 'refunded'
  | 'none'; // free tier, never purchased

/** Statuses under which premium access is granted. */
export const ACCESS_GRANTING_STATUSES: SubscriptionStatus[] = [
  'active',
  'in_grace_period',
  'in_billing_retry',
  'cancelled',
];

export type StorePlatform = 'play_store' | 'app_store' | 'stripe' | 'web' | 'promotional' | 'unknown';

export interface IUserSubscription extends Document {
  userId: mongoose.Types.ObjectId;

  /** Plan currently in force. Null means the user is on the default free plan. */
  planCode: string | null;
  status: SubscriptionStatus;

  /** RevenueCat's app_user_id — normally equal to our userId string. */
  revenueCatCustomerId?: string;
  /** Entitlement identifier RevenueCat reported as active. */
  entitlementId?: string;
  /** Store SKU that produced this subscription. */
  productId?: string;
  platform: StorePlatform;

  /** Current period boundaries as reported by the store. */
  startedAt?: Date;
  /** Access is granted while now <= expiresAt. Null for non-expiring grants. */
  expiresAt?: Date | null;
  /** Next scheduled renewal, when known. */
  renewsAt?: Date | null;
  /** Set when the user turns off auto-renew; access continues until expiresAt. */
  cancelledAt?: Date | null;
  /** Whether the store will attempt another charge. */
  willRenew: boolean;
  /** True while the store is retrying a failed payment. */
  isInGracePeriod: boolean;

  /** Whether this subscriber is currently in a free trial. */
  isTrial: boolean;
  trialEndsAt?: Date | null;

  /**
   * Monotonic ordering guard. RevenueCat does not guarantee webhook ordering,
   * so an older event that arrives late must not overwrite newer state.
   * Every write asserts `incomingEventTimestampMs >= lastEventTimestampMs`.
   */
  lastEventTimestampMs: number;
  lastEventType?: string;
  lastSyncedAt: Date;

  /** Extension point for coupons, referral credits, family plans. */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    planCode: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: [
        'active',
        'in_grace_period',
        'in_billing_retry',
        'cancelled',
        'expired',
        'paused',
        'refunded',
        'none',
      ],
      default: 'none',
      index: true,
    },

    revenueCatCustomerId: { type: String, index: true },
    entitlementId: { type: String },
    productId: { type: String },
    platform: {
      type: String,
      enum: ['play_store', 'app_store', 'stripe', 'web', 'promotional', 'unknown'],
      default: 'unknown',
    },

    startedAt: { type: Date },
    expiresAt: { type: Date, default: null, index: true },
    renewsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    willRenew: { type: Boolean, default: false },
    isInGracePeriod: { type: Boolean, default: false },

    isTrial: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },

    lastEventTimestampMs: { type: Number, default: 0 },
    lastEventType: { type: String },
    lastSyncedAt: { type: Date, default: Date.now },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/**
 * True when this subscription currently grants premium access.
 *
 * Deliberately checks BOTH status and expiry: a webhook we never received
 * (network partition, RevenueCat outage) could leave a stale `active` row, and
 * the expiry check ensures access still lapses on time without one.
 */
userSubscriptionSchema.methods.isActiveNow = function (
  this: IUserSubscription,
  at: Date = new Date()
): boolean {
  if (!ACCESS_GRANTING_STATUSES.includes(this.status)) return false;
  if (this.expiresAt && at > this.expiresAt) return false;
  return true;
};

/** Sweep index for the reconciliation cron: find rows that lapsed while active. */
userSubscriptionSchema.index({ status: 1, expiresAt: 1 });

export const UserSubscription = mongoose.model<IUserSubscription>(
  'UserSubscription',
  userSubscriptionSchema
);
