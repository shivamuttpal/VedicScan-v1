import { Router } from 'express';
import { subscriptionController } from '../controller/subscription.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Public pricing endpoint — no auth required
router.get('/pricing', subscriptionController.getPricing);

// Stripe webhook — requires raw body for signature verification
router.post('/webhook', subscriptionController.handleWebhook);

// RevenueCat webhook — Apple IAP + Google Play Billing (unauthenticated, token-verified inside handler)
router.post('/revenuecat-webhook', subscriptionController.handleRevenueCatWebhook);

// GET unsubscribe — public (accessed via email link, no auth required)
router.get('/unsubscribe-emails', subscriptionController.unsubscribeEmails);

// Protected routes
router.use(authMiddleware);
router.get('/status', subscriptionController.getStatus);
router.post('/create-checkout-session', subscriptionController.createOrder);
router.post('/revenuecat-sync', subscriptionController.syncRevenueCat);
router.post('/resubscribe-emails', subscriptionController.resubscribeEmails);
// POST unsubscribe — authenticated (from UI toggle)
router.post('/unsubscribe-emails', subscriptionController.unsubscribeEmails);
router.post('/verify-payment', subscriptionController.verifyPayment); // returns 400

export { router as subscriptionRouter };
