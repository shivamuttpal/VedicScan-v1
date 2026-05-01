import { Router } from 'express';
import { babyNamingController } from '../controller/baby-naming.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { checkFeatureAccess } from '../../../middlewares/featureAccess.middleware';

const router = Router();

// Require authentication for baby naming services
router.use(authMiddleware);

router.post('/generate', checkFeatureAccess('baby-naming'), babyNamingController.generate);
router.post('/explain', checkFeatureAccess('baby-naming'), babyNamingController.explain);

export { router as babyNamingRouter };
