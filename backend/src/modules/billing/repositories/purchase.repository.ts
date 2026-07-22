/**
 * Purchase Repository — live consumable (add-on) grants.
 */

import mongoose from 'mongoose';
import { Purchase, IPurchase, PurchaseHistory, IPurchaseHistory } from '../models';

export const purchaseRepository = {
  /**
   * All add-on packs that are currently usable: not expired, not refunded, and
   * still holding at least one unconsumed unit.
   *
   * Expiry is filtered here at READ time rather than relying on a cron to mark
   * rows expired. That ordering matters — if the cron is late or fails, a stale
   * `status: 'active'` row must not keep granting quota.
   */
  async findActiveForUser(userId: string, at: Date = new Date()): Promise<IPurchase[]> {
    return Purchase.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
      expiresAt: { $gt: at },
      'grants.remaining': { $gt: 0 },
    })
      .sort({ expiresAt: 1 }) // consume soonest-expiring first
      .exec();
  },

  /**
   * Create an add-on grant. Returns null when `transactionId` already exists,
   * which is the idempotency guarantee against replayed webhooks — a duplicate
   * delivery must never grant a second pack.
   */
  async createIfNew(data: Partial<IPurchase>): Promise<IPurchase | null> {
    try {
      return await Purchase.create(data);
    } catch (err: any) {
      if (err?.code === 11000) return null;
      throw err;
    }
  },

  /**
   * Atomically consume one unit of `featureKey` from a specific pack.
   *
   * The positional `grants.$` operator updates only the matched grant, and the
   * `remaining: { $gt: 0 }` filter prevents two concurrent requests from both
   * draining the last unit.
   */
  async consumeGrant(
    purchaseId: mongoose.Types.ObjectId,
    featureKey: string,
    amount = 1,
    at: Date = new Date()
  ): Promise<IPurchase | null> {
    return Purchase.findOneAndUpdate(
      {
        _id: purchaseId,
        status: 'active',
        expiresAt: { $gt: at },
        grants: { $elemMatch: { featureKey, remaining: { $gte: amount } } },
      },
      { $inc: { 'grants.$.remaining': -amount } },
      { new: true }
    ).exec();
  },

  /** Return a consumed unit after downstream failure. */
  async refundGrant(
    purchaseId: mongoose.Types.ObjectId,
    featureKey: string,
    amount = 1
  ): Promise<void> {
    await Purchase.updateOne(
      { _id: purchaseId, 'grants.featureKey': featureKey },
      { $inc: { 'grants.$.remaining': amount } }
    ).exec();
  },

  /**
   * Housekeeping only — flips lapsed packs to `expired` for clean reporting.
   * Not load-bearing: `findActiveForUser` already excludes them by date.
   */
  async markExpiredPurchases(at: Date = new Date()): Promise<number> {
    const result = await Purchase.updateMany(
      { status: 'active', expiresAt: { $lte: at } },
      { $set: { status: 'expired' } }
    ).exec();
    return result.modifiedCount ?? 0;
  },

  /** Void a pack after a store refund, revoking any unconsumed units. */
  async markRefundedByTransaction(transactionId: string): Promise<IPurchase | null> {
    return Purchase.findOneAndUpdate(
      { transactionId },
      { $set: { status: 'refunded' } },
      { new: true }
    ).exec();
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await Purchase.deleteMany({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  },

  // ─── Billing ledger ────────────────────────────────────────────────────────

  /**
   * Append a ledger entry. Idempotent on (revenueCatEventId, entryType) so a
   * replayed webhook cannot double-post a charge to the user's history.
   */
  async appendHistory(entry: Partial<IPurchaseHistory>): Promise<IPurchaseHistory | null> {
    if (entry.revenueCatEventId) {
      const existing = await PurchaseHistory.findOne({
        revenueCatEventId: entry.revenueCatEventId,
        entryType: entry.entryType,
      })
        .select('_id')
        .exec();
      if (existing) return null;
    }
    return PurchaseHistory.create(entry);
  },

  async findHistoryForUser(
    userId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{ entries: IPurchaseHistory[]; total: number; page: number; limit: number }> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const [entries, total] = await Promise.all([
      PurchaseHistory.find({ userId: objectId })
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean<IPurchaseHistory[]>()
        .exec(),
      PurchaseHistory.countDocuments({ userId: objectId }).exec(),
    ]);

    return { entries, total, page: Math.max(page, 1), limit: safeLimit };
  },
};
