import { Router } from 'express';
import { chatController } from '../controller/chat.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { requireFeature, FEATURE_KEYS } from '../../billing';
import { chatContextMiddleware } from '../middleware/chatContext.middleware';

const router = Router();

router.use(authMiddleware);

// Pipeline: auth → reserve one AI chat unit → load conversation/AI context → handle.
//
// requireFeature reserves quota BEFORE the expensive OpenAI call, so concurrent
// requests cannot burst past the daily limit. If the request then fails with a
// 5xx the reserved unit is released automatically, and chatContextMiddleware
// releases it explicitly when a message is rejected for length.
router.post(
  '/message',
  requireFeature(FEATURE_KEYS.AI_CHAT),
  chatContextMiddleware,
  chatController.handleMessage
);

router.get('/history', chatController.getHistory);
router.delete('/history/:id', chatController.deleteHistory);

export { router as chatRouter };
