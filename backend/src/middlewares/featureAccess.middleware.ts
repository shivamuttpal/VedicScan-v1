import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { User } from '../modules/user/model/user.model';
import { UserUsage } from '../modules/subscription/model/subscription.model';
import { isOneTimeFeature, PLAN_DISPLAY_NAMES, SUBSCRIPTION_PLANS, PAYMENTS_ENABLED } from '../config/plans';

/**
 * Middleware to check if a user has access to a one-time feature.
 * 
 * Access is granted if ANY of these are true:
 * 1. User is an Admin
 * 2. User has permanently purchased the feature (purchasedFeatures array)
 * 3. User has an ACTIVE Standard or Premium subscription (included while subscribed)
 * 
 * When the subscription expires, access is revoked unless the user
 * also purchased the feature separately.
 * 
 * To add a new feature, just add it to ONE_TIME_FEATURES in config/plans.ts
 * and apply this middleware to the route. Nothing else needs to change.
 */
export const checkFeatureAccess = (feature: string) => {
  // Validate at middleware creation time (startup) — fail fast if misconfigured
  if (!isOneTimeFeature(feature)) {
    console.warn(`[featureAccess] WARNING: "${feature}" is not in ONE_TIME_FEATURES. Check config/plans.ts`);
  }

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TEMP: payments disabled — everyone has access to every feature.
      if (!PAYMENTS_ENABLED) {
        return next();
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const user = await User.findById(userId).select('role purchasedFeatures');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      // ── 1. Admins have access to everything ──
      if (user.role === 'admin') {
        return next();
      }

      // ── 2. Permanently purchased ──
      if (user.purchasedFeatures?.includes(feature)) {
        return next();
      }

      // ── 3. Active Standard or Premium subscription includes all one-time features ──
      const usage = await UserUsage.findOne({ userId }).select('plan planEndDate');
      if (usage) {
        const hasActiveSub = SUBSCRIPTION_PLANS.includes(usage.plan as any);
        const notExpired = !usage.planEndDate || new Date() <= usage.planEndDate;

        if (hasActiveSub && notExpired) {
          return next();
        }
      }

      // ── Access denied ──
      const displayName = PLAN_DISPLAY_NAMES[feature] || feature;

      res.status(403).json({
        success: false,
        message: `${displayName} requires an active subscription or a one-time purchase.`,
        detail: {
          type: 'feature_locked',
          feature,
          displayName,
          upgrade_url: '/subscription',
        }
      });
    } catch (error) {
      console.error('Feature access middleware error:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
};
