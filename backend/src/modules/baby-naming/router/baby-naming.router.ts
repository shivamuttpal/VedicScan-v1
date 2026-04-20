import { Router } from 'express';
import { babyNamingController } from '../controller/baby-naming.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// Require authentication for baby naming services
router.use(authMiddleware);

router.post('/generate', babyNamingController.generate);
router.post('/explain', babyNamingController.explain);

export { router as babyNamingRouter };
