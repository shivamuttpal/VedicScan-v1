/**
 * Usage Counter — one row per (user, feature, window).
 *
 * The compound unique index on {userId, featureKey, periodKey} is what makes the
 * quota engine both correct and concurrency-safe: consumption is a single
 * atomic `findOneAndUpdate` with `upsert:true` and `$inc`, so two simultaneous
 * requests can never both read "4 of 5 used" and both succeed.
 *
 * Rows are never mutated on reset. A new window simply produces a new
 * `periodKey`, so the old row is left behind as an immutable historical record
 * and the new one starts at zero. The retention cron prunes rows older than the
 * configured window.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUsageCounter extends Document {
  userId: mongoose.Types.ObjectId;
  /** References `Feature.key`. */
  featureKey: string;
  /**
   * Deterministic window identifier from `getPeriodKey()`:
   * '2026-07-19' (daily) | '2026-07' (monthly) | 'lifetime'.
   */
  periodKey: string;
  /** Units consumed in this window. */
  used: number;
  /** Copied from the plan at first write — lets us audit "limit at the time". */
  limitAtPeriod: number;
  /** When this window closes. Null for lifetime counters. Drives TTL cleanup. */
  resetAt?: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const usageCounterSchema = new Schema<IUsageCounter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    featureKey: { type: String, required: true },
    periodKey: { type: String, required: true },
    used: { type: Number, default: 0, min: 0 },
    limitAtPeriod: { type: Number, default: 0 },
    resetAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * The atomicity guarantee for the whole quota engine. Must stay unique.
 * A duplicate-key error here means two upserts raced; the service retries.
 */
usageCounterSchema.index({ userId: 1, featureKey: 1, periodKey: 1 }, { unique: true });

/** Supports the retention cron's range delete. */
usageCounterSchema.index({ resetAt: 1 });

export const UsageCounter = mongoose.model<IUsageCounter>('UsageCounter', usageCounterSchema);
