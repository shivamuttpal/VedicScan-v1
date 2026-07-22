/**
 * Billing Routes
 *
 * Mounted at /api/billing.
 *
 * Route ordering matters here: the webhook and public catalogue are registered
 * BEFORE `router.use(authMiddleware)`, because RevenueCat's servers have no JWT
 * and the paywall must render pre-signup. Everything after that line is
 * authenticated by default — a new route added at the bottom is protected
 * automatically rather than by remembering to add a guard.
 */

import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import {
  planController,
  subscriptionController,
  webhookController,
  webCheckoutController,
} from '../controllers';
import { verifyRevenueCatWebhook } from '../middleware';

const router = Router();

// ─── Webhooks (no JWT — each provider authenticates differently) ─────────────
// RevenueCat: static bearer token, checked in middleware.
router.post('/webhooks/revenuecat', verifyRevenueCatWebhook, webhookController.handleRevenueCat);
// Stripe: HMAC signature over the RAW body, verified inside the handler.
router.post('/webhooks/stripe', webCheckoutController.handleStripeWebhook);

// ─── Public catalogue (no auth — paywall renders before sign-up) ─────────────
router.get('/plans', planController.list);
router.get('/plans/:code', planController.getByCode);

// ─── Everything below requires authentication ────────────────────────────────
router.use(authMiddleware);

router.get('/status', subscriptionController.getStatus);
router.get('/subscription', subscriptionController.getSubscription);
router.get('/quota/:featureKey', subscriptionController.getFeatureQuota);
router.get('/history', subscriptionController.getHistory);

router.post('/sync', subscriptionController.sync);
router.post('/restore', subscriptionController.restore);

// Web (Stripe) checkout. Mobile purchases go through the RevenueCat SDK instead,
// but both rails grant entitlements through the same engine.
router.post('/checkout', webCheckoutController.createSession);

export { router as billingRouter };
