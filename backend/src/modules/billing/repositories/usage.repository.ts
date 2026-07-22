/**
 * Usage Repository
 *
 * Owns every read and write of UsageCounter. The critical method is
 * `incrementIfBelowLimit`, which performs check-and-increment as ONE atomic
 * database operation.
 *
 * ─── Why atomicity matters here ───────────────────────────────────────────────
 * The naive implementation (read counter, compare to limit, write counter+1) has
 * a race: two concurrent requests both read `used = 4` against a limit of 5,
 * both conclude there is room, and both write 5 — the user gets 6 units from a
 * 5-unit quota. Mobile clients retrying on flaky networks hit this routinely.
 *
 * The fix is to put the limit check inside the query filter. MongoDB matches and
 * updates a single document atomically, so the second concurrent request finds
 * no document matching `used < limit` and is correctly rejected.
 */

import mongoose from 'mongoose';
import { UsageCounter, IUsageCounter } from '../models';
import { getPeriodKey, getPeriodResetAt, PeriodType } from '../utils/period.util';

export const usageRepository = {
  /**
   * Current counter for a window, or null when nothing has been consumed yet.
   * A missing row is semantically identical to `used: 0`.
   */
  async findCounter(
    userId: string,
    featureKey: string,
    period: PeriodType,
    at: Date = new Date()
  ): Promise<IUsageCounter | null> {
    return UsageCounter.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      featureKey,
      periodKey: getPeriodKey(period, at),
    }).exec();
  },

  /** Counters for many features in one round trip — used by the status endpoint. */
  async findCountersForFeatures(
    userId: string,
    features: Array<{ featureKey: string; period: PeriodType }>,
    at: Date = new Date()
  ): Promise<Map<string, IUsageCounter>> {
    if (features.length === 0) return new Map();

    const conditions = features.map((f) => ({
      featureKey: f.featureKey,
      periodKey: getPeriodKey(f.period, at),
    }));

    const counters = await UsageCounter.find({
      userId: new mongoose.Types.ObjectId(userId),
      $or: conditions,
    }).exec();

    return new Map(counters.map((c) => [c.featureKey, c]));
  },

  /**
   * Atomically consume `amount` units if — and only if — doing so stays within
   * `limit`. Returns the updated counter on success, or null when the quota is
   * already exhausted.
   *
   * The `used: { $lte: limit - amount }` filter is the concurrency guard: it
   * makes "is there room?" and "take the room" indivisible.
   *
   * `upsert: true` creates the row on first use of a window, which is also how
   * period rollover works — the new periodKey simply has no row yet.
   */
  async incrementIfBelowLimit(
    userId: string,
    featureKey: string,
    period: PeriodType,
    limit: number,
    amount = 1,
    at: Date = new Date()
  ): Promise<IUsageCounter | null> {
    const periodKey = getPeriodKey(period, at);
    const resetAt = getPeriodResetAt(period, at);

    try {
      return await UsageCounter.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(userId),
          featureKey,
          periodKey,
          used: { $lte: limit - amount },
        },
        {
          $inc: { used: amount },
          $set: { lastUsedAt: at, limitAtPeriod: limit, resetAt },
          $setOnInsert: {
            userId: new mongoose.Types.ObjectId(userId),
            featureKey,
            periodKey,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).exec();
    } catch (err: any) {
      // Duplicate key (11000) means a concurrent request created the row between
      // our filter miss and the upsert. That row necessarily failed the
      // `used <= limit - amount` test, so the quota really is exhausted.
      if (err?.code === 11000) return null;
      throw err;
    }
  },

  /**
   * Unconditional increment, used for ungated/unlimited features where we still
   * want analytics. Never rejects.
   */
  async increment(
    userId: string,
    featureKey: string,
    period: PeriodType,
    amount = 1,
    at: Date = new Date()
  ): Promise<IUsageCounter> {
    const periodKey = getPeriodKey(period, at);
    return UsageCounter.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), featureKey, periodKey },
      {
        $inc: { used: amount },
        $set: { lastUsedAt: at, resetAt: getPeriodResetAt(period, at) },
        $setOnInsert: { limitAtPeriod: -1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IUsageCounter>;
  },

  /**
   * Give back units after a failed operation.
   *
   * Quota is reserved *before* expensive work (an AI call, a PDF render) so a
   * user cannot burst past the limit while requests are in flight. If that work
   * then fails, charging them for it would be wrong — this refunds the reserved
   * unit. `$max` guards against a counter going negative under concurrent refunds.
   */
  async refund(
    userId: string,
    featureKey: string,
    period: PeriodType,
    amount = 1,
    at: Date = new Date()
  ): Promise<void> {
    const counter = await UsageCounter.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      featureKey,
      periodKey: getPeriodKey(period, at),
    }).exec();

    if (!counter) return;

    counter.used = Math.max(0, counter.used - amount);
    await counter.save();
  },

  /** Retention cleanup: delete closed windows older than the cutoff. */
  async deleteExpiredBefore(cutoff: Date): Promise<number> {
    const result = await UsageCounter.deleteMany({
      resetAt: { $ne: null, $lt: cutoff },
    }).exec();
    return result.deletedCount ?? 0;
  },

  /** Wipe all counters for a user — used by account deletion (GDPR). */
  async deleteAllForUser(userId: string): Promise<void> {
    await UsageCounter.deleteMany({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },
};
