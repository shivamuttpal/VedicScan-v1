/**
 * Billing Constants — symbolic identifiers ONLY.
 *
 * ─── Why these are not "hardcoded plans" ──────────────────────────────────────
 * These are string *references* to rows in MongoDB, not configuration. They
 * carry no limits, no prices, no currencies and no feature behaviour — exactly
 * the things that must stay database-driven.
 *
 * Their purpose is compile-time safety at call sites:
 *
 *   requireFeature(FEATURE_KEYS.KUNDALI_REPORT)   ✅ typo caught by TypeScript
 *   requireFeature('kundali_reprot')              ❌ silently never matches
 *
 * A misspelled feature key would otherwise resolve to "not in plan" and lock
 * every user out of a working feature, with no error to point at it.
 *
 * Adding a feature still requires no logic change: insert the Feature document,
 * add it to the relevant plans, and add its key here for the route to reference.
 */

/** Gateable capabilities. Must match `Feature.key` values in the database. */
export const FEATURE_KEYS = {
  /** AI astrologer chat sessions. Resets daily. */
  AI_CHAT: 'ai_chat',
  /** Detailed Kundali report with downloadable PDF. Resets monthly. */
  KUNDALI_REPORT: 'kundali_report',
  /** Basic Kundali generation, no PDF. Free-tier lifetime allowance. */
  KUNDALI_BASIC: 'kundali_basic',
  /** Detailed Compatibility report with downloadable PDF. Resets monthly. */
  COMPATIBILITY_REPORT: 'compatibility_report',
  /** Basic Compatibility match, no PDF. Free-tier lifetime allowance. */
  COMPATIBILITY_BASIC: 'compatibility_basic',
  /** Baby naming suggestions. Unlimited on paid plans. */
  BABY_NAMING: 'baby_naming',
  /** Daily personalised Rashifal notifications. Available on every plan. */
  RASHIFAL_NOTIFICATION: 'rashifal_notification',
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

/**
 * Plan codes seeded by default. Referenced by the seeder and by tests.
 *
 * Application logic must NOT branch on these values — behaviour comes from the
 * plan document's entitlements. The single legitimate exception is
 * `DEFAULT_PLAN_CODE` in billing.config, which identifies the fallback plan.
 */
export const PLAN_CODES = {
  FREE: 'free',
  STANDARD_MONTHLY: 'standard_monthly',
  STANDARD_YEARLY: 'standard_yearly',
  ADDON_PACK: 'addon_pack',
} as const;

export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];

/** RevenueCat entitlement identifiers, mirrored from the RevenueCat dashboard. */
export const RC_ENTITLEMENTS = {
  STANDARD: 'standard_access',
} as const;
