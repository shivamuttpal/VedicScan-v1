import { Router } from 'express';
import { subscriptionController } from '../controller/subscription.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Webhook must be unauthenticated and handled before global JSON parser if possible,
// but we'll define it here. NOTE: Requires raw body.
router.post('/webhook', subscriptionController.handleWebhook);

// Unsubscribe from emails — public (accessed via email link, no auth required)
router.post('/unsubscribe-emails', subscriptionController.unsubscribeEmails);
router.get('/unsubscribe-emails', subscriptionController.unsubscribeEmails); // GET for email link clicks

// Protected routes
router.use(authMiddleware);
router.get('/status', subscriptionController.getStatus);
router.post('/create-checkout-session', subscriptionController.createOrder);
router.post('/resubscribe-emails', subscriptionController.resubscribeEmails);
router.post('/verify-payment', subscriptionController.verifyPayment); // returns 400

export { router as subscriptionRouter };
