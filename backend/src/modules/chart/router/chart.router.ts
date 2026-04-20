import { Router } from 'express';
import { chartController } from '../controller/chart.controller';

const router = Router();

router.post('/calculate', chartController.calculateChart);

export { router as chartRouter };
