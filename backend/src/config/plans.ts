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
      monthly: 100,
      annual: 299900,
    },
    premium: {
      monthly: 100,
      annual: 999900,
    },
    'one-time': {
      compatibility: 99900,
      'baby-naming': 99900,
    }
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
    }
  }
};

/**
 * Get limits for a given plan type
 */
export const getPlanLimits = (plan: PlanType): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};
