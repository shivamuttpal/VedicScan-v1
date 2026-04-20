import { Router } from 'express';
import { chatController } from '../controller/chat.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { usageLimitMiddleware } from '../../../middlewares/usageLimit.middleware';

const router = Router();

router.use(authMiddleware);

// Message route: auth → usage limit check → handle message
router.post('/message', usageLimitMiddleware, chatController.handleMessage);
router.get('/history', chatController.getHistory);
router.delete('/history/:id', chatController.deleteHistory);

export { router as chatRouter };
