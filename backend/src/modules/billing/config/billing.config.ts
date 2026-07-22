/**
 * Billing Configuration
 *
 * Deliberately minimal: this file holds only *infrastructure* settings
 * (timezone anchor, kill switch, RevenueCat credentials, cache TTLs).
 *
 * It contains NO plans, prices, currencies, limits or feature definitions —
 * those live exclusively in MongoDB (see `seeds/plans.seed.ts`) so they can be
 * changed at runtime without a redeploy. If you find yourself wanting to add a
 * price or a limit here, add it to the database instead.
 */

import config from '../../../config';

/**
 * Wall-clock anchor for every quota window. Defaults to IST (UTC+5:30) because
 * the primary market is India. Changing this shifts when daily/monthly limits
 * reset for all users, so change it only with intent.
 */
export const BILLING_TZ_OFFSET_MINUTES = parseInt(
  process.env.BILLING_TIMEZONE_OFFSET_MINUTES || '330',
  10
);

/**
 * Global paywall kill switch.
 *
 * When false, entitlement and quota middleware short-circuit to "allow" while
 * still recording usage for analytics. Intended as an emergency lever if a
 * launch-day billing bug would otherwise lock paying users out of the app.
 *
 * Defaults to ENABLED — you must explicitly set BILLING_ENFORCEMENT_ENABLED=false
 * to disable it, so enforcement can never lapse through a missing env var.
 */
export const BILLING_ENFORCEMENT_ENABLED =
  process.env.BILLING_ENFORCEMENT_ENABLED !== 'false';

/** RevenueCat REST + webhook credentials, re-exported from the root config. */
export const revenueCatConfig = {
  secretKey: config.revenueCat.secretKey,
  webhookAuthToken: config.revenueCat.webhookAuthToken,
  /** Accept SANDBOX-environment webhook events even when NODE_ENV=production. */
  allowSandbox: config.revenueCat.allowSandbox,
  apiBaseUrl: process.env.REVENUECAT_API_BASE_URL || 'https://api.revenuecat.com',
  /** Per-request timeout for RevenueCat REST calls. */
  timeoutMs: parseInt(process.env.REVENUECAT_TIMEOUT_MS || '8000', 10),
};

/**
 * How long the plan catalogue is cached in process memory. Plans change rarely
 * but are read on nearly every premium request, so caching avoids a DB round
 * trip per call. Set to 0 to disable caching entirely (useful while tuning
 * prices in staging).
 */
export const PLAN_CACHE_TTL_MS = parseInt(process.env.PLAN_CACHE_TTL_MS || '60000', 10);

/** Identifier of the plan granted to users who have never purchased anything. */
export const DEFAULT_PLAN_CODE = process.env.DEFAULT_PLAN_CODE || 'free';
