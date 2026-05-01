/**
 * Usage Limit Middleware
 * 
 * Enforces per-plan daily and monthly question limits,
 * and validates message word count before reaching the AI.
 * 
 * Auto-resets daily counters at IST midnight and
 * monthly counters on the 1st of each month.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserUsage, getISTMidnight, getISTMonthStart } from '../modules/subscription/model/subscription.model';
import { getPlanLimits, PlanType } from '../config/plans';
import { User } from '../modules/user/model/user.model';

export const usageLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Get or create usage record
    let usage = await UserUsage.findOne({ userId });
    if (!usage) {
      usage = new UserUsage({ userId, plan: 'free' });
      await usage.save();
    }

    let plan = usage.plan as PlanType;

    // ─── Check for plan expiration ───
    if (plan !== 'free' && usage.planEndDate && new Date() > usage.planEndDate) {
      console.log(`[UsageMiddleware] Plan ${plan} expired for user ${userId}. Reverting to free.`);
      usage.previousPlan = usage.plan;
      usage.plan = 'free';
      usage.billingCycle = 'none';
      await usage.save();
      plan = 'free';

      // Revert isSubscriber flag
      await User.updateOne({ _id: userId }, { $set: { isSubscriber: false } });
    }

    const limits = getPlanLimits(plan);

    // ─── Auto-reset daily counters ───
    const todayMidnight = getISTMidnight();
    if (usage.lastDailyReset < todayMidnight) {
      usage.dailyQuestionsUsed = 0;
      usage.dailyTokensUsed = 0;
      usage.lastDailyReset = todayMidnight;
    }

    // ─── Auto-reset monthly counters ───
    const monthStart = getISTMonthStart();
    if (usage.lastMonthlyReset < monthStart) {
      usage.monthlyQuestionsUsed = 0;
      usage.monthlyTokensUsed = 0;
      usage.lastMonthlyReset = monthStart;
    }

    // ─── Check daily limit ───
    if (usage.dailyQuestionsUsed >= limits.dailyQuestions) {
      const nextReset = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
      res.status(429).json({
        success: false,
        detail: {
          message: `Daily question limit reached (${limits.dailyQuestions}/${limits.dailyQuestions}). Resets at midnight IST.`,
          type: 'daily_limit',
          usage: {
            daily: { used: usage.dailyQuestionsUsed, limit: limits.dailyQuestions, remaining: 0 },
            monthly: { used: usage.monthlyQuestionsUsed, limit: limits.monthlyQuestions, remaining: Math.max(0, limits.monthlyQuestions - usage.monthlyQuestionsUsed) },
          },
          next_reset: nextReset.toISOString(),
          plan,
          upgrade_available: plan !== 'premium',
        },
      });
      return;
    }

    // ─── Check monthly limit ───
    if (usage.monthlyQuestionsUsed >= limits.monthlyQuestions) {
      res.status(429).json({
        success: false,
        detail: {
          message: `Monthly question limit reached (${limits.monthlyQuestions}/${limits.monthlyQuestions}). Resets on the 1st of next month.`,
          type: 'monthly_limit',
          usage: {
            daily: { used: usage.dailyQuestionsUsed, limit: limits.dailyQuestions, remaining: Math.max(0, limits.dailyQuestions - usage.dailyQuestionsUsed) },
            monthly: { used: usage.monthlyQuestionsUsed, limit: limits.monthlyQuestions, remaining: 0 },
          },
          plan,
          upgrade_available: plan !== 'premium',
        },
      });
      return;
    }

    // ─── Validate message word count ───
    const message = req.body?.message;
    if (message) {
      const wordCount = message.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      if (wordCount > limits.maxWordsPerQuestion) {
        res.status(400).json({
          success: false,
          message: `Message too long. Your plan allows ${limits.maxWordsPerQuestion} words per question. You sent ${wordCount} words.`,
          detail: {
            type: 'word_limit',
            wordCount,
            maxWords: limits.maxWordsPerQuestion,
            plan,
            upgrade_available: plan !== 'premium',
          },
        });
        return;
      }

      // Strip excessively long individual words (>80 chars) as a safety measure
      const sanitizedWords = message.trim().split(/\s+/).map((word: string) => {
        return word.length > 80 ? word.substring(0, 80) : word;
      });
      req.body.message = sanitizedWords.join(' ');
    }

    // Attach usage document and plan limits to the request for the controller
    (req as any).userUsage = usage;
    (req as any).planLimits = limits;

    // Save any resets that happened
    await usage.save();

    next();
  } catch (error) {
    console.error('Usage limit middleware error:', error);
    // SECURITY: Block the request on middleware failure to prevent limit bypass
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again in a moment.',
    });
  }
};
