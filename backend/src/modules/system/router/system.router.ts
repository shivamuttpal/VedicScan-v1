import { Router } from 'express';
import { testEmail, testPhone } from '../controller/system.controller';
import { authMiddleware, roleMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Secure these endpoints - only admins should be able to trigger diagnostic tests
router.post('/test-email', authMiddleware, testEmail);
router.post('/test-phone', authMiddleware, testPhone);

export default router;
