import { Router } from 'express';
import { compatibilityController } from '../controller/compatibility.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { checkFeatureAccess } from '../../../middlewares/featureAccess.middleware';

const router = Router();

router.use(authMiddleware);

// Basic compatibility analysis — included with standard/premium subscription or one-time compatibility purchase
router.post('/analyze', checkFeatureAccess('compatibility'), compatibilityController.analyze);

// Full 9-page premium PDF report — premium subscription or one-time compatibility-report purchase only
// Access control is enforced inside the controller (premium plan or purchased feature)
router.post('/report', compatibilityController.generateReport);

export { router as compatibilityRouter };
