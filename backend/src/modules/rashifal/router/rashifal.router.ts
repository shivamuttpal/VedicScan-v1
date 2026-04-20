import { Router } from 'express';
import * as RashifalController from '../controller/rashifal.controller';

const router = Router();

router.get('/', RashifalController.getDailyRashifal);
router.post('/trigger', RashifalController.triggerDailyGeneration); // Admin/Manual trigger

export default router;
