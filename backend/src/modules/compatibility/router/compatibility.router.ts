import { Router } from 'express';
import { compatibilityController } from '../controller/compatibility.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Require authentication for compatibility analysis
router.use(authMiddleware);

router.post('/analyze', compatibilityController.analyze);

export { router as compatibilityRouter };
