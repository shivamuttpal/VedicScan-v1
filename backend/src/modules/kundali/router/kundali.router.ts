import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { kundaliController } from '../controller/kundali.controller';

const router = Router();

router.use(authMiddleware as any);

router.post('/generate', kundaliController.generate);
router.get('/list', kundaliController.list);
router.get('/:id', kundaliController.getById);
router.get('/:id/pdf', kundaliController.downloadPDF);
router.delete('/:id', kundaliController.deleteKundali);

export default router;
