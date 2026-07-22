/**
 * Feature Unlock — records that a user has already paid for a SPECIFIC resource.
 *
 * ─── The problem this solves ──────────────────────────────────────────────────
 * Detailed reports are rendered on demand from a stored record, so the PDF
 * endpoint can be hit many times for the same Kundali or compatibility match —
 * the user re-downloads it, shares it, loses the file, switches device. Metering
 * the endpoint directly would charge a fresh report unit every time, so a user
 * with "5 reports per month" could burn all five re-opening one document.
 *
 * An unlock row makes the charge idempotent per resource: the first request for
 * a given (user, feature, resource) consumes quota and records the unlock; every
 * later request for that same resource matches the row and is served free.
 *
 * The unique index is what guarantees this under concurrency — two simultaneous
 * downloads cannot both create an unlock, so they cannot both be charged.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureUnlock extends Document {
  userId: mongoose.Types.ObjectId;
  /** References `Feature.key` — the entitlement that was spent. */
  featureKey: string;
  /**
   * Identifier of the specific thing unlocked, e.g. a Kundali document id.
   * Scoped per feature, so the same id under two features unlocks separately.
   */
  resourceId: string;
  /** Which window's quota paid for this, for auditing and support queries. */
  periodKey: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const featureUnlockSchema = new Schema<IFeatureUnlock>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    featureKey: { type: String, required: true },
    resourceId: { type: String, required: true },
    periodKey: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/** The idempotency guarantee. Must stay unique. */
featureUnlockSchema.index({ userId: 1, featureKey: 1, resourceId: 1 }, { unique: true });

export const FeatureUnlock = mongoose.model<IFeatureUnlock>('FeatureUnlock', featureUnlockSchema);
