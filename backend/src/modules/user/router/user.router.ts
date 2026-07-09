import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// SECURITY: strict limiter for authentication & OTP endpoints to slow brute-force
// of passwords and 6-digit OTPs. Tighter than the global limiter in server.ts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please wait a few minutes and try again.',
  },
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), userController.register.bind(userController));
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), userController.verifyEmailSignup.bind(userController));
router.post('/verify-phone', authLimiter, validate(verifyPhoneSchema), userController.verifyPhoneSignup.bind(userController));
router.post('/verify-signup', authLimiter, validate(verifySignupSchema), userController.verifySignup.bind(userController));
router.post('/resend-otp', authLimiter, validate(resendOTPSchema), userController.resendOTP.bind(userController));
router.post('/login', authLimiter, validate(loginSchema), userController.login.bind(userController));
router.post('/google-login', authLimiter, userController.googleLogin.bind(userController));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), userController.forgotPassword.bind(userController));
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), userController.verifyOTP.bind(userController));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), userController.resetPassword.bind(userController));

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
// Self-service account deletion (must be declared before the admin '/:id' route
// so 'account' isn't captured as an :id param).
router.delete(
  '/account',
  authMiddleware,
  userController.deleteAccount.bind(userController)
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
