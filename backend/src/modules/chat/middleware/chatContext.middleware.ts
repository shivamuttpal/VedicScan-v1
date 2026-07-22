/**
 * Chat Context Middleware
 *
 * Bridges the billing layer to the chat controller.
 *
 * ─── Separation of concerns ───────────────────────────────────────────────────
 * Quota enforcement is NOT done here — `requireFeature(FEATURE_KEYS.AI_CHAT)`
 * runs before this middleware and has already reserved the user's chat unit.
 * This middleware only supplies the two things the controller still needs:
 *
 *   1. `req.userUsage`  — the UserUsage document, retained solely for its
 *      `threadMap` (conversationId → OpenAI thread id) and cumulative token
 *      accounting. That is conversation state, not billing state, which is why
 *      it survived the migration to the billing module.
 *
 *   2. `req.planLimits` — AI tuning parameters (response length, context depth,
 *      word cap) read from the resolved plan's `metadata`. These come from
 *      MongoDB, so they are tunable per tier without a redeploy.
 *
 * The word-count check lives here rather than in the billing module because it
 * shapes the AI request; it is a product constraint, not an entitlement.
 */

import { Response, NextFunction } from 'express';
import { UserUsage } from '../../subscription/model/subscription.model';
import type { BillingRequest } from '../../billing';

/** AI tuning parameters resolved from the active plan's metadata. */
export interface ResolvedPlanLimits {
  maxWordsPerQuestion: number;
  maxContextMessages: number;
  maxCompletionTokens: number;
  chatHistoryRetentionDays: number;
}

/**
 * Conservative defaults used only when a plan document omits `metadata`.
 * These are fallbacks against misconfiguration, not the source of truth — a
 * correctly seeded plan always overrides every one of them.
 */
const FALLBACK_LIMITS: ResolvedPlanLimits = {
  maxWordsPerQuestion: 150,
  maxContextMessages: 4,
  maxCompletionTokens: 800,
  chatHistoryRetentionDays: 7,
};

function resolveLimits(metadata: Record<string, unknown> | undefined): ResolvedPlanLimits {
  const meta = metadata ?? {};
  const num = (key: keyof ResolvedPlanLimits): number => {
    const value = meta[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : FALLBACK_LIMITS[key];
  };

  return {
    maxWordsPerQuestion: num('maxWordsPerQuestion'),
    maxContextMessages: num('maxContextMessages'),
    maxCompletionTokens: num('maxCompletionTokens'),
    chatHistoryRetentionDays: num('chatHistoryRetentionDays'),
  };
}

export const chatContextMiddleware = async (
  req: BillingRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const limits = resolveLimits(req.billing?.entitlements.plan.metadata);

    // ── Enforce the per-plan word cap before the AI call ──
    const message = req.body?.message;
    if (typeof message === 'string' && message.trim()) {
      const words = message.trim().split(/\s+/).filter((w: string) => w.length > 0);

      if (words.length > limits.maxWordsPerQuestion) {
        // The chat unit was already reserved by requireFeature. Hand it back —
        // a rejected message must not consume the user's daily allowance.
        await req.billing?.release();

        res.status(400).json({
          success: false,
          message: `Message too long. Your plan allows ${limits.maxWordsPerQuestion} words per question; you sent ${words.length}.`,
          detail: {
            type: 'word_limit',
            wordCount: words.length,
            maxWords: limits.maxWordsPerQuestion,
            plan: req.billing?.entitlements.plan.code,
          },
        });
        return;
      }

      // Truncate pathologically long single tokens (base64 blobs, URLs) that
      // would otherwise inflate token cost without adding meaning.
      req.body.message = words.map((w: string) => (w.length > 80 ? w.slice(0, 80) : w)).join(' ');
    }

    // ── Load conversation state (thread map + token totals) ──
    const usage = await UserUsage.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    (req as any).userUsage = usage;
    (req as any).planLimits = limits;

    next();
  } catch (error) {
    console.error('[ChatContext] Failed to prepare chat context:', error);
    // Release the reserved quota — the user never got their answer.
    await req.billing?.release().catch(() => undefined);
    res.status(503).json({
      success: false,
      message: 'Chat is temporarily unavailable. Please try again in a moment.',
    });
  }
};
