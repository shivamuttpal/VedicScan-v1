/**
 * User Subscription Repository
 *
 * The `upsertFromEvent` method carries the out-of-order protection for the whole
 * webhook pipeline — see the note on that method.
 */

import mongoose from 'mongoose';
import { UserSubscription, IUserSubscription } from '../models';

export const subscriptionRepository = {
  async findByUserId(userId: string): Promise<IUserSubscription | null> {
    return UserSubscription.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },

  async findByRevenueCatCustomerId(customerId: string): Promise<IUserSubscription | null> {
    return UserSubscription.findOne({ revenueCatCustomerId: customerId }).exec();
  },

  /**
   * Write verified subscription state, but ONLY if this event is at least as
   * recent as the last one we applied.
   *
   * RevenueCat explicitly does not guarantee webhook ordering. A CANCELLATION
   * emitted at T+0 can arrive after the RENEWAL emitted at T+1 — applying them
   * in arrival order would leave a paying customer marked cancelled. The
   * `lastEventTimestampMs: { $lte: eventTimestampMs }` filter makes stale events
   * no-ops.
   *
   * Returns null when the write was skipped as stale, which the caller records
   * as an `ignored` event rather than an error.
   */
  async upsertFromEvent(
    userId: string,
    eventTimestampMs: number,
    update: Partial<IUserSubscription>
  ): Promise<IUserSubscription | null> {
    const objectId = new mongoose.Types.ObjectId(userId);

    const result = await UserSubscription.findOneAndUpdate(
      {
        userId: objectId,
        lastEventTimestampMs: { $lte: eventTimestampMs },
      },
      {
        $set: {
          ...update,
          lastEventTimestampMs: eventTimestampMs,
          lastSyncedAt: new Date(),
        },
        $setOnInsert: { userId: objectId },
      },
      { new: true, upsert: false }
    ).exec();

    if (result) return result;

    // No match: either the row does not exist yet, or the event is stale.
    const existing = await UserSubscription.findOne({ userId: objectId }).select('_id').exec();
    if (existing) return null; // exists but newer than this event → stale, skip.

    // First event for this user — create the row.
    try {
      return await UserSubscription.create({
        userId: objectId,
        ...update,
        lastEventTimestampMs: eventTimestampMs,
        lastSyncedAt: new Date(),
      });
    } catch (err: any) {
      // Lost a creation race; re-run the guarded update against the winner's row.
      if (err?.code === 11000) {
        return UserSubscription.findOneAndUpdate(
          { userId: objectId, lastEventTimestampMs: { $lte: eventTimestampMs } },
          { $set: { ...update, lastEventTimestampMs: eventTimestampMs, lastSyncedAt: new Date() } },
          { new: true }
        ).exec();
      }
      throw err;
    }
  },

  /** Ensure a row exists so status reads have something to project from. */
  async ensureExists(userId: string): Promise<IUserSubscription> {
    const objectId = new mongoose.Types.ObjectId(userId);
    return UserSubscription.findOneAndUpdate(
      { userId: objectId },
      { $setOnInsert: { userId: objectId, status: 'none', planCode: null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IUserSubscription>;
  },

  /**
   * Reconciliation sweep: rows still marked access-granting whose expiry has
   * passed. These indicate a webhook we never received, so the cron downgrades
   * them defensively.
   */
  async findLapsed(now: Date = new Date(), limit = 500): Promise<IUserSubscription[]> {
    return UserSubscription.find({
      status: { $in: ['active', 'in_grace_period', 'in_billing_retry', 'cancelled'] },
      expiresAt: { $ne: null, $lt: now },
    })
      .limit(limit)
      .exec();
  },

  async markExpired(userId: mongoose.Types.ObjectId): Promise<void> {
    await UserSubscription.updateOne(
      { _id: userId },
      { $set: { status: 'expired', planCode: null, willRenew: false } }
    ).exec();
  },

  async deleteForUser(userId: string): Promise<void> {
    await UserSubscription.deleteOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },
};
