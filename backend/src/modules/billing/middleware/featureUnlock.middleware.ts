/**
 * One-Time Feature Unlock Middleware
 *
 * Charges a user at most once for a given resource, no matter how many times
 * they request it. Use this instead of `requireFeature` on any endpoint that can
 * legitimately be called repeatedly for the same underlying item — PDF
 * downloads, report re-renders, shareable links.
 *
 * Flow:
 *   1. Already unlocked?  → serve free, no quota touched.
 *   2. Not unlocked?      → reserve quota, then record the unlock.
 *   3. Unlock insert lost a race? → another request just paid for it; refund
 *      ours and serve free rather than charging twice.
 *
 * See `FeatureUnlock` for why per-resource idempotency is necessary.
 */

import { Response, NextFunction } from 'express';
import { FeatureUnlock } from '../models';
import { entitlementService, usageService } from '../services';
import { BILLING_ENFORCEMENT_ENABLED } from '../config/billing.config';
import { getPeriodKey } from '../utils/period.util';
import type { BillingRequest } from './entitlement.middleware';
import mongoose from 'mongoose';

/** Pulls the resource identifier out of the request. */
type ResourceIdResolver = (req: BillingRequest) => string | undefined;

interface RequireFeatureOnceOptions {
  /** Defaults to `req.params.id`. */
  resolveResourceId?: ResourceIdResolver;
}

export const requireFeatureOnce = (
  featureKey: string,
  options: RequireFeatureOnceOptions = {}
) => {
  const resolveResourceId: ResourceIdResolver =
    options.resolveResourceId ?? ((req) => req.params?.id);

  return async (req: BillingRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const resourceId = resolveResourceId(req);
    if (!resourceId) {
      res.status(400).json({ success: false, message: 'Resource identifier is required.' });
      return;
    }

    try {
      const entitlements = await entitlementService.resolve(userId);

      if (!BILLING_ENFORCEMENT_ENABLED) {
        req.billing = { entitlements, featureKey, release: async () => {} };
        return next();
      }

      const objectId = new mongoose.Types.ObjectId(userId);

      // ── 1. Already paid for this exact resource ──
      const existing = await FeatureUnlock.findOne({ userId: objectId, featureKey, resourceId })
        .select('_id')
        .exec();

      if (existing) {
        req.billing = { entitlements, featureKey, release: async () => {} };
        return next();
      }

      // ── 2. First access — charge for it ──
      const entitlement = entitlements.features.get(featureKey);
      if (!entitlement) {
        res.status(403).json({
          success: false,
          message: 'This feature is not included in your current plan.',
          detail: {
            type: 'feature_locked',
            feature: featureKey,
            currentPlan: entitlements.plan.code,
            upgradeAvailable: true,
          },
        });
        return;
      }

      const result = await usageService.consume(userId, featureKey, 1, new Date(), entitlements);

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          message: `You have used all ${result.limit} of your ${featureKey.replace(/_/g, ' ')} allowance for this period.`,
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
        return;
      }

      // ── 3. Record the unlock ──
      try {
        await FeatureUnlock.create({
          userId: objectId,
          featureKey,
          resourceId,
          periodKey: getPeriodKey(entitlement.period),
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          // A concurrent request unlocked it a moment ago. Refund ours so the
          // user is charged exactly once, then serve normally.
          await result.release();
        } else {
          // Could not record the unlock — refund rather than charging for
          // something we cannot prove they own.
          await result.release();
          throw err;
        }
      }

      req.billing = {
        entitlements,
        featureKey,
        consumption: result,
        release: result.release,
      };

      // Release automatically if rendering fails downstream.
      let released = false;
      res.on('finish', () => {
        if (res.statusCode >= 500 && !released) {
          released = true;
          Promise.all([
            result.release(),
            FeatureUnlock.deleteOne({ userId: objectId, featureKey, resourceId }).exec(),
          ]).catch((err) =>
            console.error(`[Billing] Failed to roll back unlock for ${userId}/${featureKey}:`, err)
          );
        }
      });

      next();
    } catch (error) {
      // FAIL CLOSED.
      console.error(`[Billing] Unlock check failed for ${featureKey}:`, error);
      res.status(503).json({
        success: false,
        message: 'Subscription service is temporarily unavailable. Please try again shortly.',
        detail: { type: 'billing_unavailable', feature: featureKey },
      });
    }
  };
};
