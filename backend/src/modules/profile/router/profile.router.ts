import { Router } from 'express';
import { profileController } from '../controller/profile.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', profileController.getProfiles);
router.get('/default', profileController.getDefaultProfile);
router.post('/', profileController.createProfile);
router.put('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);

export { router as profileRouter };
