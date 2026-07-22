import { Router } from 'express';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { kundaliController } from '../controller/kundali.controller';
import { requireFeature, requireFeatureOnce, FEATURE_KEYS } from '../../billing';

const router = Router();

router.use(authMiddleware as any);

// Chart generation — the basic tier. Free users get one for their lifetime;
// paid plans have it unlimited.
router.post('/generate', requireFeature(FEATURE_KEYS.KUNDALI_BASIC), kundaliController.generate);

router.get('/list', kundaliController.list);
router.get('/:id', kundaliController.getById);

// Detailed PDF report — the metered premium deliverable (5/month on Standard).
//
// requireFeatureOnce, not requireFeature: the PDF is re-rendered from the stored
// chart on every request, so metering the endpoint directly would charge a fresh
// report unit each time the user re-downloads or re-shares the same document.
// The first download for a given kundali id consumes quota and records an
// unlock; later downloads of that same id are free.
router.get(
  '/:id/pdf',
  requireFeatureOnce(FEATURE_KEYS.KUNDALI_REPORT),
  kundaliController.downloadPDF
);

router.delete('/:id', kundaliController.deleteKundali);

export default router;
