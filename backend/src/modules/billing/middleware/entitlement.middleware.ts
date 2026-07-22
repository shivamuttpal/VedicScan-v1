/**
 * Entitlement & Quota Middleware
 *
 * The enforcement boundary for premium features. Attach `requireFeature('key')`
 * to a route and the request cannot reach the controller unless the user's
 * server-verified subscription includes that feature and has quota left.
 *
 * ─── Security posture: FAIL CLOSED ────────────────────────────────────────────
 * If entitlement resolution throws — database down, plans unseeded, RevenueCat
 * unreachable — the request is REJECTED with 503, never allowed through. An
 * error must never become a free upgrade. The one deliberate exception is the
 * BILLING_ENFORCEMENT_ENABLED kill switch, which is an explicit operator
 * decision rather than an accident.
 *
 * ─── Reserve on entry, release on failure ─────────────────────────────────────
 * Quota is consumed before the controller runs. To avoid charging users for work
 * that then failed, the middleware hooks `res.on('finish')` and automatically
 * releases the reserved unit when the response status is 5xx. Controllers can
 * also release explicitly via `req.billing.release()` for domain-level failures
 * that still return 200.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { entitlementService, usageService } from '../services';
import type { ResolvedEntitlements, ConsumeSuccess } from '../services';
import { BILLING_ENFORCEMENT_ENABLED } from '../config/billing.config';

/** Billing context attached to the request for downstream handlers. */
export interface BillingContext {
  entitlements: ResolvedEntitlements;
  featureKey?: string;
  consumption?: ConsumeSuccess;
  /** Hand the reserved quota back. No-op when nothing was reserved. */
  release: () => Promise<void>;
}

export interface BillingRequest extends AuthRequest {
  billing?: BillingContext;
}

interface RequireFeatureOptions {
  /** Units to reserve. Defaults to 1. */
  amount?: number;
  /**
   * When true, verify entitlement but do NOT consume quota. Use for endpoints
   * that only preview or validate before the real, billable call.
   */
  checkOnly?: boolean;
  /**
   * Automatically release the reservation when the response is 5xx.
   * Defaults to true — a server error is our fault, not the user's.
   */
  releaseOnServerError?: boolean;
}

/**
 * Guard a route behind a feature entitlement and its quota.
 *
 * @param featureKey  Must match a `Feature.key` and appear in plan entitlements.
 */
export const requireFeature = (featureKey: string, options: RequireFeatureOptions = {}) => {
  const { amount = 1, checkOnly = false, releaseOnServerError = true } = options;

  return async (req: BillingRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    try {
      const entitlements = await entitlementService.resolve(userId);

      // ── Operator kill switch ──
      // Records usage for analytics but never blocks. Intentionally placed after
      // resolution so a seeding error still surfaces as a 503 below.
      if (!BILLING_ENFORCEMENT_ENABLED) {
        req.billing = { entitlements, featureKey, release: async () => {} };
        return next();
      }

      // ── Verify only, do not spend ──
      if (checkOnly) {
        const status = await entitlementService.getQuotaStatus(
          userId,
          featureKey,
          new Date(),
          entitlements
        );
        if (!status) {
          respondFeatureLocked(res, featureKey, entitlements.plan.code);
          return;
        }
        req.billing = { entitlements, featureKey, release: async () => {} };
        return next();
      }

      // ── Reserve quota ──
      const result = await usageService.consume(userId, featureKey, amount, new Date(), entitlements);

      if (!result.allowed) {
        if (result.reason === 'feature_not_in_plan') {
          respondFeatureLocked(res, featureKey, result.currentPlan);
        } else {
          respondQuotaExhausted(res, featureKey, result);
        }
        return;
      }

      req.billing = {
        entitlements,
        featureKey,
        consumption: result,
        release: result.release,
      };

      // Refund automatically if the request dies with a server error.
      if (releaseOnServerError) {
        let released = false;
        res.on('finish', () => {
          if (res.statusCode >= 500 && !released) {
            released = true;
            result
              .release()
              .catch((err) =>
                console.error(`[Billing] Failed to release quota for ${userId}/${featureKey}:`, err)
              );
          }
        });
      }

      next();
    } catch (error) {
      // FAIL CLOSED — never let an internal error grant free access.
      console.error(`[Billing] Entitlement check failed for ${featureKey}:`, error);
      res.status(503).json({
        success: false,
        message: 'Subscription service is temporarily unavailable. Please try again shortly.',
        detail: { type: 'billing_unavailable', feature: featureKey },
      });
    }
  };
};

/**
 * Require an active paid subscription without tying the route to a specific
 * feature — useful for account-level endpoints (manage billing, premium-only
 * settings) where per-feature quota is meaningless.
 */
export const requireActiveSubscription = () => {
  return async (req: BillingRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    try {
      const entitlements = await entitlementService.resolve(userId);

      if (!BILLING_ENFORCEMENT_ENABLED || entitlements.isPremium) {
        req.billing = { entitlements, release: async () => {} };
        return next();
      }

      res.status(403).json({
        success: false,
        message: 'This feature requires an active subscription.',
        detail: { type: 'subscription_required', currentPlan: entitlements.plan.code },
      });
    } catch (error) {
      console.error('[Billing] Subscription check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Subscription service is temporarily unavailable. Please try again shortly.',
      });
    }
  };
};

/**
 * Attach billing context without enforcing anything.
 *
 * For endpoints that serve both tiers with different behaviour — e.g. Kundali
 * returns a basic result for free users and a full PDF for subscribers. The
 * controller reads `req.billing` and decides.
 */
export const attachEntitlements = () => {
  return async (req: BillingRequest, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) return next();

    try {
      req.billing = {
        entitlements: await entitlementService.resolve(userId),
        release: async () => {},
      };
    } catch (error) {
      // Non-fatal: this middleware never gates, so degrade to no context.
      console.error('[Billing] Failed to attach entitlements:', error);
    }
    next();
  };
};

// ─── Response helpers ────────────────────────────────────────────────────────
// Denials return structured `detail` objects so the app can render the right
// paywall without string-matching on messages.

function respondFeatureLocked(res: Response, featureKey: string, currentPlan: string): void {
  res.status(403).json({
    success: false,
    message: 'This feature is not included in your current plan.',
    detail: {
      type: 'feature_locked',
      feature: featureKey,
      currentPlan,
      upgradeAvailable: true,
    },
  });
}

function respondQuotaExhausted(
  res: Response,
  featureKey: string,
  result: { used: number; limit: number; resetAt: Date | null; currentPlan: string }
): void {
  res.status(429).json({
    success: false,
    message: result.resetAt
      ? `You have used all ${result.limit} of your ${featureKey.replace(/_/g, ' ')} allowance for this period.`
      : `You have used your full ${featureKey.replace(/_/g, ' ')} allowance.`,
    detail: {
      type: 'quota_exhausted',
      feature: featureKey,
      used: result.used,
      limit: result.limit,
      remaining: 0,
      resetAt: result.resetAt?.toISOString() ?? null,
      currentPlan: result.currentPlan,
      upgradeAvailable: true,
    },
  });
}
