import { Router } from 'express';
import { babyNamingController } from '../controller/baby-naming.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { requireFeature, FEATURE_KEYS } from '../../billing';

const router = Router();

// Require authentication for baby naming services
router.use(authMiddleware);

// Baby Naming is unlimited on paid plans and absent from the Free plan, so the
// middleware returns `feature_locked` (403) for free users and lets subscribers
// straight through. The unlimited entitlement still records usage for analytics.
router.post('/generate', requireFeature(FEATURE_KEYS.BABY_NAMING), babyNamingController.generate);

// `explain` elaborates on an already-generated suggestion, so it verifies
// entitlement without consuming quota — the user should not be charged twice
// for a single naming session.
router.post(
  '/explain',
  requireFeature(FEATURE_KEYS.BABY_NAMING, { checkOnly: true }),
  babyNamingController.explain
);

export { router as babyNamingRouter };
