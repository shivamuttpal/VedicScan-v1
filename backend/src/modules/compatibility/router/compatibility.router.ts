import { Router } from 'express';
import { compatibilityController } from '../controller/compatibility.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { requireFeature, FEATURE_KEYS } from '../../billing';

const router = Router();

router.use(authMiddleware);

// Basic compatibility match — no PDF. Free users get one for their lifetime;
// paid plans have it unlimited. Both resolve from plan entitlements in MongoDB.
router.post(
  '/analyze',
  requireFeature(FEATURE_KEYS.COMPATIBILITY_BASIC),
  compatibilityController.analyze
);

// Detailed report with downloadable/shareable PDF — metered monthly on paid
// plans (5/month, plus any add-on units) and entirely absent from the Free plan,
// which yields a `feature_locked` upgrade prompt rather than a quota message.
//
// Access is now enforced HERE rather than inside the controller, so the gate is
// visible at the route definition and cannot be bypassed by a new code path.
router.post(
  '/report',
  requireFeature(FEATURE_KEYS.COMPATIBILITY_REPORT),
  compatibilityController.generateReport
);

export { router as compatibilityRouter };
