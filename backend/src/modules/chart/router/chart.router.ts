import { Router } from 'express';
import { chartController } from '../controller/chart.controller';

import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/calculate', chartController.calculateChart);

export { router as chartRouter };
