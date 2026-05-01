import { Router } from 'express';
import { compatibilityController } from '../controller/compatibility.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { checkFeatureAccess } from '../../../middlewares/featureAccess.middleware';

const router = Router();

// Require authentication for compatibility analysis
router.use(authMiddleware);

router.post('/analyze', checkFeatureAccess('compatibility'), compatibilityController.analyze);

export { router as compatibilityRouter };
