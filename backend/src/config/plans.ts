/**
 * Subscription Plan Limits Configuration
 * 
 * Centralized plan definitions for usage enforcement.
 * Tuned for profitability with GPT-4o-mini:
 *   - Free: ~₹0.84/mo AI cost (loss leader for conversion)
 *   - Standard: ~₹5.60/mo cost → ₹293 profit (98% margin)
 *   - Premium: ~₹28/mo cost → ₹971 profit (97% margin)
 */

export type PlanType = 'free' | 'standard' | 'premium';

export interface PlanLimits {
  dailyQuestions: number;
  monthlyQuestions: number;
  maxWordsPerQuestion: number;
  maxContextMessages: number;      // how many past messages to include in thread context
  maxCompletionTokens: number;     // cap on AI response length
  chatHistoryRetentionDays: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    dailyQuestions: 3,
    monthlyQuestions: 30,
    maxWordsPerQuestion: 150,
    maxContextMessages: 4,          // last 2 Q&A pairs
    maxCompletionTokens: 800,
    chatHistoryRetentionDays: 7,
  },
  standard: {
    dailyQuestions: 11,
    monthlyQuestions: 200,
    maxWordsPerQuestion: 300,
    maxContextMessages: 10,         // last 5 Q&A pairs
    maxCompletionTokens: 800,
    chatHistoryRetentionDays: 90,
  },
  premium: {
    dailyQuestions: 51,
    monthlyQuestions: 1000,
    maxWordsPerQuestion: 500,
    maxContextMessages: 20,         // last 10 Q&A pairs
    maxCompletionTokens: 800,
    chatHistoryRetentionDays: -1,   // unlimited
  },
};

/**
 * Plan Prices in lowest currency unit (Paise for INR, Cents for USD)
 */
export const PLAN_PRICES = {
  INR: {
    standard: {
      monthly: 5000,
      annual: 299900,
    },
    premium: {
      monthly: 5000,
      annual: 999900,
    },
    'one-time': {
      compatibility: 99900,
      'baby-naming': 99900,
    } as Record<string, number>,
  },
  USD: {
    standard: {
      monthly: 2900,
      annual: 29000,
    },
    premium: {
      monthly: 9900,
      annual: 99000,
    },
    'one-time': {
      compatibility: 9900,
      'baby-naming': 9900,
    } as Record<string, number>,
  }
};

/**
 * ─── Centralized Validation Lists ─────────────────────
 * Add new plans or features in ONE place. Everything else reads from here.
 */

/** Subscription plans that have recurring billing */
export const SUBSCRIPTION_PLANS: PlanType[] = ['standard', 'premium'];

/** One-time purchasable features. Add new features here only. */
export const ONE_TIME_FEATURES: string[] = ['compatibility', 'baby-naming'];

/** All valid purchasable items (subscriptions + one-time) */
export const ALL_PURCHASABLE = [...SUBSCRIPTION_PLANS, ...ONE_TIME_FEATURES];

/** Plan display names for emails */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  premium: 'Premium',
  compatibility: 'Compatibility Analysis',
  'baby-naming': 'Baby Naming',
};

/**
 * Check if a plan string is a valid subscription plan
 */
export const isSubscriptionPlan = (plan: string): plan is PlanType => {
  return SUBSCRIPTION_PLANS.includes(plan as PlanType);
};

/**
 * Check if a plan string is a valid one-time feature
 */
export const isOneTimeFeature = (plan: string): boolean => {
  return ONE_TIME_FEATURES.includes(plan);
};

/**
 * Check if a plan string is any valid purchasable item
 */
export const isValidPurchase = (plan: string): boolean => {
  return ALL_PURCHASABLE.includes(plan as PlanType);
};

/**
 * Get limits for a given plan type
 */
export const getPlanLimits = (plan: PlanType): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};
