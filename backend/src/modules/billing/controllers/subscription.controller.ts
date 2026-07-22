/**
 * Subscription Controller — authenticated, user-scoped billing endpoints.
 *
 * Every response is derived from server-verified state. No endpoint here accepts
 * a subscription claim from the client; `sync` and `restore` merely trigger a
 * fresh verification against RevenueCat.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { entitlementService, revenueCatSyncService, RevenueCatApiError } from '../services';
import { purchaseRepository, subscriptionRepository } from '../repositories';
import { syncSubscriptionSchema, historyQuerySchema } from '../validators/billing.validator';
import { successResponse, errorResponse } from '../../../utils/response.util';
import type { FeatureQuotaStatus } from '../services';

/** JSON-safe quota shape. `Infinity` is not valid JSON, so unlimited → null. */
function serializeQuota(quota: FeatureQuotaStatus) {
  return {
    feature: quota.featureKey,
    limit: quota.unlimited ? null : quota.totalLimit,
    planLimit: quota.unlimited ? null : quota.planLimit,
    addonLimit: quota.addonLimit,
    used: quota.used,
    remaining: quota.unlimited ? null : quota.remaining,
    unlimited: quota.unlimited,
    period: quota.period,
    allowed: quota.allowed,
    resetAt: quota.resetAt?.toISOString() ?? null,
  };
}

export const subscriptionController = {
  /**
   * GET /api/billing/status
   *
   * The single endpoint the app polls to render entitlement state: current plan,
   * subscription lifecycle, every feature quota, and live add-on packs.
   */
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { resolved, quotas } = await entitlementService.getAllQuotaStatuses(userId);
      const subscription = resolved.subscription;

      return successResponse(
        res,
        {
          plan: {
            code: resolved.plan.code,
            displayName: resolved.plan.displayName,
            kind: resolved.plan.kind,
            billingInterval: resolved.plan.billingInterval,
          },
          isPremium: resolved.isPremium,
          subscription: subscription
            ? {
                status: subscription.status,
                platform: subscription.platform,
                productId: subscription.productId,
                startedAt: subscription.startedAt?.toISOString() ?? null,
                expiresAt: subscription.expiresAt?.toISOString() ?? null,
                renewsAt: subscription.renewsAt?.toISOString() ?? null,
                cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
                willRenew: subscription.willRenew,
                isInGracePeriod: subscription.isInGracePeriod,
                isTrial: subscription.isTrial,
                trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
                lastSyncedAt: subscription.lastSyncedAt?.toISOString() ?? null,
              }
            : { status: 'none', platform: 'unknown', willRenew: false },
          quotas: quotas.map(serializeQuota),
          addons: resolved.activePurchases.map((p) => ({
            planCode: p.planCode,
            purchasedAt: p.purchasedAt.toISOString(),
            expiresAt: p.expiresAt.toISOString(),
            grants: p.grants.map((g) => ({
              feature: g.featureKey,
              granted: g.granted,
              remaining: g.remaining,
            })),
          })),
        },
        'Subscription status retrieved successfully'
      );
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/billing/quota/:featureKey
   * Lightweight single-feature check for pre-flighting an action in the UI.
   */
  async getFeatureQuota(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quota = await entitlementService.getQuotaStatus(
        req.user!.userId,
        req.params.featureKey
      );

      if (!quota) {
        return errorResponse(res, 'This feature is not included in your current plan.', 403, {
          type: 'feature_locked',
          feature: req.params.featureKey,
        });
      }

      return successResponse(res, serializeQuota(quota), 'Quota retrieved successfully');
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/billing/sync
   *
   * Called by the app after a purchase completes or on app launch. Re-derives
   * subscription state from RevenueCat's REST API.
   *
   * This exists because webhooks are not instantaneous — sandbox delivery in
   * particular can lag by many seconds. Without it, a user who just paid would
   * briefly still see the paywall. The client cannot influence the outcome; it
   * only asks us to look again.
   */
  async sync(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = syncSubscriptionSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return errorResponse(res, 'Invalid request body', 400, parsed.error.flatten());
      }

      const userId = req.user!.userId;
      const result = await revenueCatSyncService.syncFromRevenueCat(userId, parsed.data.appUserId);
      const { resolved, quotas } = await entitlementService.getAllQuotaStatuses(userId);

      return successResponse(
        res,
        {
          synced: result.synced,
          plan: { code: resolved.plan.code, displayName: resolved.plan.displayName },
          isPremium: resolved.isPremium,
          status: result.status,
          quotas: quotas.map(serializeQuota),
        },
        result.synced ? 'Subscription synchronised' : 'No active subscription found'
      );
    } catch (error) {
      if (error instanceof RevenueCatApiError) {
        // 502/503 (not 500) tells the client this is upstream and retryable.
        return errorResponse(
          res,
          'Could not reach the subscription provider. Please try again shortly.',
          error.retryable ? 502 : 503,
          { type: 'provider_unavailable' }
        );
      }
      return next(error);
    }
  },

  /**
   * POST /api/billing/restore
   *
   * Purchase restoration after a reinstall or device change.
   *
   * Functionally identical to `sync` — RevenueCat already reconciles store
   * receipts against the app_user_id, so "restore" on the backend just means
   * re-reading the truth. Exposed separately because it maps to a distinct user
   * action and keeps client code readable.
   */
  async restore(req: AuthRequest, res: Response, next: NextFunction) {
    return subscriptionController.sync(req, res, next);
  },

  /**
   * GET /api/billing/history
   * Paginated billing ledger for the "Purchase history" screen.
   */
  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = historyQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return errorResponse(res, 'Invalid query parameters', 400, parsed.error.flatten());
      }

      const { entries, total, page, limit } = await purchaseRepository.findHistoryForUser(
        req.user!.userId,
        parsed.data
      );

      return successResponse(
        res,
        {
          entries: entries.map((e) => ({
            id: e._id,
            type: e.entryType,
            planCode: e.planCode,
            planName: e.planDisplayName,
            productId: e.productId,
            platform: e.platform,
            amount: e.amountMinor != null ? e.amountMinor / 100 : null,
            currency: e.currency,
            periodStart: e.periodStart?.toISOString() ?? null,
            periodEnd: e.periodEnd?.toISOString() ?? null,
            occurredAt: e.occurredAt.toISOString(),
          })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
        'Billing history retrieved successfully'
      );
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/billing/subscription
   * Raw subscription record — used by support tooling and debug screens.
   */
  async getSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionRepository.ensureExists(req.user!.userId);
      return successResponse(res, subscription, 'Subscription retrieved successfully');
    } catch (error) {
      return next(error);
    }
  },
};
