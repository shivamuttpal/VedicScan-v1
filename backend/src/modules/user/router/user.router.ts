import { Router } from 'express';
import { userController } from '../controller';
import { authMiddleware, roleMiddleware, validate } from '../../../middlewares';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  verifySignupSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  resendOTPSchema,
} from './user.validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), userController.register.bind(userController));
router.post('/verify-email', validate(verifyEmailSchema), userController.verifyEmailSignup.bind(userController));
router.post('/verify-phone', validate(verifyPhoneSchema), userController.verifyPhoneSignup.bind(userController));
router.post('/verify-signup', validate(verifySignupSchema), userController.verifySignup.bind(userController));
router.post('/resend-otp', validate(resendOTPSchema), userController.resendOTP.bind(userController));
router.post('/login', validate(loginSchema), userController.login.bind(userController));
router.post('/google-login', userController.googleLogin.bind(userController));
router.post('/forgot-password', validate(forgotPasswordSchema), userController.forgotPassword.bind(userController));
router.post('/verify-otp', validate(verifyOTPSchema), userController.verifyOTP.bind(userController));
router.post('/reset-password', validate(resetPasswordSchema), userController.resetPassword.bind(userController));

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile.bind(userController));
router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  userController.changePassword.bind(userController)
);

// Admin routes
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  userController.getAllUsers.bind(userController)
);
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(userIdParamSchema),
  userController.getUserById.bind(userController)
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validate(userIdParamSchema),
  userController.deleteUser.bind(userController)
);

export default router;
