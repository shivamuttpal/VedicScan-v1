/**
 * RevenueCat Event Repository — the idempotency gate.
 */

import mongoose from 'mongoose';
import { RevenueCatEvent, IRevenueCatEvent } from '../models';

export const revenueCatEventRepository = {
  /**
   * Attempt to claim an event for processing.
   *
   * Returns the created document on first delivery, or null when the event id
   * has already been seen. Callers MUST treat null as "acknowledge and stop" —
   * this is the single mechanism preventing duplicate webhook deliveries from
   * double-granting entitlements.
   *
   * The claim is inserted BEFORE any state mutation, so two workers receiving
   * the same retry concurrently cannot both proceed: one wins the unique index,
   * the other gets a duplicate-key error and backs off.
   */
  async claim(data: Partial<IRevenueCatEvent>): Promise<IRevenueCatEvent | null> {
    try {
      return await RevenueCatEvent.create({ ...data, status: 'pending', attempts: 1 });
    } catch (err: any) {
      if (err?.code === 11000) return null;
      throw err;
    }
  },

  async findByEventId(eventId: string): Promise<IRevenueCatEvent | null> {
    return RevenueCatEvent.findOne({ eventId }).exec();
  },

  async markProcessed(
    eventId: string,
    userId?: mongoose.Types.ObjectId,
    note?: string
  ): Promise<void> {
    await RevenueCatEvent.updateOne(
      { eventId },
      { $set: { status: 'processed', processedAt: new Date(), processingNote: note, userId } }
    ).exec();
  },

  /**
   * Record an event we intentionally did not act on (sandbox traffic in prod,
   * unmapped product, stale ordering). Distinct from `failed` so the retry cron
   * never picks these up.
   */
  async markIgnored(eventId: string, note: string): Promise<void> {
    await RevenueCatEvent.updateOne(
      { eventId },
      { $set: { status: 'ignored', processedAt: new Date(), processingNote: note } }
    ).exec();
  },

  async markFailed(eventId: string, note: string): Promise<void> {
    await RevenueCatEvent.updateOne(
      { eventId },
      { $set: { status: 'failed', processingNote: note }, $inc: { attempts: 1 } }
    ).exec();
  },

  /**
   * Failed events eligible for the retry cron. Capped attempts stop a
   * permanently-broken event from being retried forever; those are left for
   * manual inspection.
   */
  async findRetryable(maxAttempts = 5, limit = 100): Promise<IRevenueCatEvent[]> {
    return RevenueCatEvent.find({ status: 'failed', attempts: { $lt: maxAttempts } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  },

  /** Retention: drop successfully-handled events older than the cutoff. */
  async deleteProcessedBefore(cutoff: Date): Promise<number> {
    const result = await RevenueCatEvent.deleteMany({
      status: { $in: ['processed', 'ignored'] },
      createdAt: { $lt: cutoff },
    }).exec();
    return result.deletedCount ?? 0;
  },
};
