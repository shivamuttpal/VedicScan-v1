import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { AuthRequest } from '../../../middlewares';
import {
  successResponse,
  createdResponse,
  errorResponse,
  getPaginationOptions,
  createPaginatedResult,
} from '../../../utils';
import { sendOTPEmail, sendSignupVerificationEmail } from '../../../utils/mail.util';
import { sendPhoneOTP } from '../../../utils/sms.util';

export class UserController {
  // ── Registration (creates inactive user, sends verification OTP) ──
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone } = req.body;
      const { emailOtp, phoneOtp, message } = await userService.register(req.body);
      
      // Send Email OTP
      const emailSent = await sendSignupVerificationEmail(email, emailOtp);

      // Send SMS OTP if phone is provided and phoneOtp exists
      if (phone && phoneOtp) {
        await sendPhoneOTP(phone, phoneOtp);
      }

      if (!emailSent) {
        errorResponse(res, 'Failed to send verification email', 500);
        return;
      }

      successResponse(res, null, message);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmailSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await userService.verifyEmailSignup(email, otp);
      successResponse(res, result, result.isFullyVerified ? 'Email verified and registration complete' : 'Email verified, please verify your mobile');
    } catch (error) {
      next(error);
    }
  }

  async verifyPhoneSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp } = req.body;
      const result = await userService.verifyPhoneSignup(phone, otp);
      successResponse(res, result, result.isFullyVerified ? 'Phone verified and registration complete' : 'Phone verified, please verify your email');
    } catch (error) {
      next(error);
    }
  }

  // ── Verify email OTP to activate account ──
  async verifySignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await userService.verifySignup(email, otp);
      successResponse(res, result, 'Email verified and registration complete');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.login(req.body);
      
      if (result.needsVerification) {
        if (result.email && result.emailOtp) {
          await sendSignupVerificationEmail(result.email, result.emailOtp);
        }
        if (result.phone && result.phoneOtp) {
          await sendPhoneOTP(result.phone, result.phoneOtp);
        }
        successResponse(res, result, 'Account not verified. Verification code sent.');
        return;
      }

      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) {
        errorResponse(res, 'Token is required', 400);
        return;
      }
      const result = await userService.googleLogin(token);
      successResponse(res, result, 'Google Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getProfile(req.user!.userId);
      if (!user) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      successResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      if (!user) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = getPaginationOptions(req.query);
      const role = req.query.role as string | undefined;
      const { users, total } = await userService.getAllUsers({ ...options, role });
      const result = createPaginatedResult(users, total, options);
      successResponse(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.deleteUser(req.params.id);
      if (!user) {
        errorResponse(res, 'User not found', 404);
        return;
      }
      successResponse(res, { deleted: true }, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user!.userId, currentPassword, newPassword);
      successResponse(res, { changed: true }, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  // ── Forgot Password (sends password reset OTP) ──
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const otp = await userService.forgotPassword(email);
      const emailSent = await sendOTPEmail(email, otp);

      if (!emailSent) {
        errorResponse(res, 'Failed to send OTP email', 500);
        return;
      }

      successResponse(res, null, 'OTP sent to your email');
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      await userService.verifyOTP(email, otp);
      successResponse(res, null, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await userService.resetPassword(email, otp, newPassword);
      successResponse(res, result, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
