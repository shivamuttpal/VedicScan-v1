import { Router } from 'express';
import { subscriptionController } from '../controller/subscription.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Webhook must be unauthenticated and handled before global JSON parser if possible,
// but we'll define it here. NOTE: Requires raw body.
router.post('/webhook', subscriptionController.handleWebhook);

// Protected routes
router.use(authMiddleware);
router.get('/status', subscriptionController.getStatus);
router.post('/create-checkout-session', subscriptionController.createOrder);
router.post('/verify-payment', subscriptionController.verifyPayment); // returns 400

export { router as subscriptionRouter };
