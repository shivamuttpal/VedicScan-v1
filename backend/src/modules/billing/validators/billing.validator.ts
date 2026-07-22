/**
 * Billing Request Validators
 *
 * Zod schemas matching the project's existing validation approach.
 *
 * Note what is deliberately NOT validated into trust: the sync endpoint accepts
 * no entitlement claims from the client at all. There is no `isActive`,
 * `productId` or `expiresAt` field a caller can send, because accepting one —
 * even validated — would create a path where client input influences
 * subscription state. The client may only say "please re-check me".
 */

import { z } from 'zod';

/** Optional region override for the public plan catalogue. */
export const getPlansQuerySchema = z.object({
  region: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$|^DEFAULT$/, 'Region must be a 2-letter country code or DEFAULT')
    .optional(),
});

/**
 * Sync/restore request body.
 *
 * `appUserId` is accepted only for the pre-login purchase case, where the app
 * bought under an anonymous RevenueCat id and needs it linked after sign-in.
 * It is a lookup hint — RevenueCat is still queried for the real state.
 */
export const syncSubscriptionSchema = z.object({
  appUserId: z.string().trim().min(1).max(200).optional(),
});

/**
 * Web (Stripe) checkout request.
 *
 * Note the absence of any price/amount field. The client picks a plan; the
 * server reads that plan's price from MongoDB. Accepting an amount here — even
 * a validated one — would let a tampered request buy a ₹2,499 plan for ₹1.
 */
export const createCheckoutSchema = z.object({
  planCode: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, 'Invalid plan code'),
  region: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$|^DEFAULT$/)
    .optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/** Paginated billing history query. */
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Feature key path/query parameter for quota lookups. */
export const featureKeyParamSchema = z.object({
  featureKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, 'Feature key must be lowercase alphanumeric with underscores'),
});

/**
 * RevenueCat webhook envelope.
 *
 * Kept permissive on purpose: RevenueCat adds fields over time, and rejecting an
 * event because of an unrecognised key would drop real purchases. We validate
 * only the fields we actually depend on and pass the rest through to be stored
 * verbatim in the event log.
 */
export const revenueCatWebhookSchema = z.object({
  event: z
    .object({
      id: z.string().min(1),
      type: z.string().min(1),
      app_user_id: z.string().min(1),
      event_timestamp_ms: z.number(),
    })
    .passthrough(),
  api_version: z.string().optional(),
});

export type GetPlansQuery = z.infer<typeof getPlansQuerySchema>;
export type SyncSubscriptionBody = z.infer<typeof syncSubscriptionSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
