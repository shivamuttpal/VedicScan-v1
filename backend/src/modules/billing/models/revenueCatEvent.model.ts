/**
 * RevenueCat Event Log — idempotency ledger and audit trail.
 *
 * ─── How idempotency works ────────────────────────────────────────────────────
 * RevenueCat retries webhooks on any non-2xx response and makes no
 * exactly-once guarantee, so the same event WILL arrive twice in normal
 * operation. Before doing any work we attempt to `insert` the event id. The
 * unique index means:
 *
 *   - insert succeeds  → first delivery, we own processing.
 *   - duplicate key    → already seen, acknowledge with 200 and do nothing.
 *
 * Claiming the id *before* mutating subscription state (rather than after) is
 * what makes this safe under concurrent duplicate delivery — two workers cannot
 * both win the insert.
 *
 * Every raw payload is retained so that a bug in the mapping layer can be fixed
 * and the affected events replayed without data loss.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type EventProcessingStatus = 'pending' | 'processed' | 'failed' | 'ignored';

export interface IRevenueCatEvent extends Document {
  /** RevenueCat's `event.id` — the idempotency key. */
  eventId: string;
  eventType: string;
  /** RevenueCat app_user_id as delivered. */
  appUserId: string;
  /** Resolved local user, when the app_user_id mapped to a real account. */
  userId?: mongoose.Types.ObjectId;

  productId?: string;
  entitlementIds: string[];
  store?: string;
  environment?: string;

  /** RevenueCat `event.event_timestamp_ms`, used for out-of-order protection. */
  eventTimestampMs: number;

  status: EventProcessingStatus;
  /** Why an event was ignored, or the error that made processing fail. */
  processingNote?: string;
  attempts: number;
  processedAt?: Date;

  /** Verbatim webhook body. Never trimmed — this is the replay source. */
  rawPayload: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const revenueCatEventSchema = new Schema<IRevenueCatEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    appUserId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    productId: { type: String },
    entitlementIds: { type: [String], default: [] },
    store: { type: String },
    environment: { type: String },

    eventTimestampMs: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'processed', 'failed', 'ignored'],
      default: 'pending',
      index: true,
    },
    processingNote: { type: String },
    attempts: { type: Number, default: 0 },
    processedAt: { type: Date },

    rawPayload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

/** Supports the retry cron: "failed events, oldest first". */
revenueCatEventSchema.index({ status: 1, createdAt: 1 });

export const RevenueCatEvent = mongoose.model<IRevenueCatEvent>(
  'RevenueCatEvent',
  revenueCatEventSchema
);
