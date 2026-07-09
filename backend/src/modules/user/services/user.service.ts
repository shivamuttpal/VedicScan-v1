import { userRepository } from '../repository';
import { IUser } from '../model';
import { hashPassword, comparePassword, generateToken } from '../../../utils';
import { ApiError } from '../../../middlewares';
import { OAuth2Client } from 'google-auth-library';
import { Profile } from '../../profile/model/profile.model';
import { Kundali } from '../../kundali/model/kundali.model';
import { ChatSession } from '../../chat/model/chat.model';
import { UserUsage } from '../../subscription/model/subscription.model';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName?: string;
  // NOTE: `role` is deliberately omitted — it must never be settable by the client.
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  user?: Partial<IUser>;
  token?: string;
  needsVerification?: boolean;
  email?: string;
  phone?: string;
  emailOtp?: string;
  phoneOtp?: string;
}

export class UserService {
  async register(rawInput: RegisterInput): Promise<{ emailOtp?: string; phoneOtp?: string; message: string }> {
    // SECURITY: strip any privileged/unsafe fields a client may have injected into
    // the request body (e.g. role, isActive, isSubscriber). Only whitelisted fields
    // are accepted; role is always forced to 'user' below.
    const { email, phone, password, firstName, lastName } = rawInput as any;
    const input: RegisterInput = { email, phone, password, firstName, lastName };

    // 1. Check for existing user by email OR phone
    let existingUser = null;
    if (input.email) {
      existingUser = await userRepository.findByEmail(input.email);
    }
    if (!existingUser && input.phone) {
      existingUser = await userRepository.findByPhone(input.phone);
    }
    
    const emailOtp = input.email ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const phoneOtp = (!input.email && input.phone) ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      if (existingUser.isActive) {
        const field = existingUser.email === input.email ? 'email' : 'phone number';
        throw new ApiError(409, `User with this ${field} already exists`);
      }
      
      const hashedPassword = await hashPassword(input.password);
      await userRepository.update(existingUser._id.toString(), {
        ...input,
        password: hashedPassword,
        emailOTP: emailOtp,
        emailOTPExpires: otpExpires,
        isEmailVerified: false,
        phoneOTP: phoneOtp,
        phoneOTPExpires: otpExpires,
        isPhoneVerified: false,
      });

      return { 
        emailOtp, 
        phoneOtp, 
        message: 'Verification code(s) sent' 
      };
    }

    const hashedPassword = await hashPassword(input.password);
    await userRepository.create({
      ...input,
      password: hashedPassword,
      authProvider: 'local',
      role: 'user', // SECURITY: role is never taken from client input
      isActive: false,
      emailOTP: emailOtp,
      emailOTPExpires: otpExpires,
      isEmailVerified: false,
      phoneOTP: phoneOtp,
      phoneOTPExpires: otpExpires,
      isPhoneVerified: false,
    });

    return { 
      emailOtp, 
      phoneOtp, 
      message: 'Verification code(s) sent'
    };
  }

  async verifyEmailSignup(email: string, otp: string): Promise<{ isFullyVerified: boolean; user?: IUser; token?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.isActive) throw new ApiError(400, 'Account is already active');

    if (user.emailOTP !== otp || !user.emailOTPExpires || user.emailOTPExpires < new Date()) {
      throw new ApiError(400, 'Invalid or expired email OTP');
    }

    // Mark email as verified
    const isFullyVerified = true;
    const updateData: any = { isEmailVerified: true, emailOTP: undefined, emailOTPExpires: undefined };
    
    if (isFullyVerified) {
      updateData.isActive = true;
    }

    const updatedUser = await userRepository.update(user._id.toString(), updateData);
    if (!updatedUser) throw new ApiError(500, 'Failed to update user');

    if (isFullyVerified) {
      const token = generateToken({
        userId: updatedUser._id.toString(),
        email: updatedUser.email || updatedUser.phone || '',
        role: updatedUser.role,
      });
      return { isFullyVerified: true, user: updatedUser, token };
    }

    return { isFullyVerified: false };
  }

  async verifyPhoneSignup(phone: string, otp: string): Promise<{ isFullyVerified: boolean; user?: IUser; token?: string }> {
    const user = await userRepository.findByPhone(phone);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.isActive) throw new ApiError(400, 'Account is already active');

    if (user.phoneOTP !== otp || !user.phoneOTPExpires || user.phoneOTPExpires < new Date()) {
      throw new ApiError(400, 'Invalid or expired phone OTP');
    }

    // Mark phone as verified
    const isFullyVerified = true;
    const updateData: any = { isPhoneVerified: true, phoneOTP: undefined, phoneOTPExpires: undefined };
    
    if (isFullyVerified) {
      updateData.isActive = true;
    }

    const updatedUser = await userRepository.update(user._id.toString(), updateData);
    if (!updatedUser) throw new ApiError(500, 'Failed to update user');

    if (isFullyVerified) {
      const token = generateToken({
        userId: updatedUser._id.toString(),
        email: updatedUser.email || updatedUser.phone || '',
        role: updatedUser.role,
      });
      return { isFullyVerified: true, user: updatedUser, token };
    }

    return { isFullyVerified: false };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    let user = null;
    if (input.email) {
      user = await userRepository.findByEmail(input.email);
    } else if (input.phone) {
      user = await userRepository.findByPhone(input.phone);
    }

    if (!user) {
      throw new ApiError(401, 'Invalid identifier or password');
    }
    
    if (user.authProvider === 'google') {
      throw new ApiError(401, 'Please login with Google.');
    }

    if (!user.isActive) {
      if (!user.isEmailVerified || !user.isPhoneVerified) {
        // Generate new OTP for verification resumption
        const emailOtp = user.email ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
        const phoneOtp = (!user.email && user.phone) ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await userRepository.update(user._id.toString(), {
          emailOTP: emailOtp,
          emailOTPExpires: otpExpires,
          phoneOTP: phoneOtp,
          phoneOTPExpires: otpExpires,
        });

        return { 
          needsVerification: true, 
          email: user.email, 
          phone: user.phone,
          emailOtp,
          phoneOtp 
        };
      }
      throw new ApiError(403, 'Account is deactivated');
    }

    if (!user.password) {
      throw new ApiError(401, 'Invalid identifier or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid identifier or password');
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email || user.phone || '',
      role: user.role,
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
      token,
    };
  }

  async googleLogin(clientToken: string): Promise<AuthResponse> {
    try {
      let email: string | undefined;
      let given_name: string | undefined;
      let family_name: string | undefined;
      let name: string | undefined;
      let picture: string | undefined;
      let sub: string | undefined;

      // 1. Preferred: verify as a Google ID token — cryptographically verified and
      //    audience-checked against our client ID, so it can't be replayed from another app.
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: clientToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const p = ticket.getPayload();
        if (p?.email) {
          ({ email, given_name, family_name, name, picture, sub } = p as any);
        }
      } catch {
        // Not a valid ID token for our audience — fall back to access-token flow below.
      }

      // 2. Fallback: treat the value as an OAuth access token and call the userinfo endpoint.
      if (!email) {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${clientToken}` }
        });
        const payload: any = await response.json();
        if (response.ok && payload?.email) {
          ({ email, given_name, family_name, name, picture, sub } = payload);
        }
      }

      if (!email) {
        throw new ApiError(400, 'Invalid Google Token');
      }

      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          email,
          firstName: given_name || name || 'User',
          lastName: family_name || '',
          profileImage: picture,
          authProvider: 'google',
          isActive: true, // Google verified users are active immediately
          role: 'user',
        } as any);
      } else if (!user.googleId) {
        // Link account if email matches but wasn't Google auth originally
        await userRepository.update(user._id.toString(), {
          googleId: sub,
          authProvider: 'google',
          profileImage: user.profileImage || picture,
        });
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      throw new ApiError(401, 'Google Authentication failed');
    }
  }

  async getProfile(userId: string): Promise<IUser | null> {
    return userRepository.findById(userId);
  }

  async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    // Don't allow updating sensitive fields
    const { password, email, role, ...safeData } = updateData;
    return userRepository.update(userId, safeData);
  }

  async getAllUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<{ users: IUser[]; total: number }> {
    const filter: any = {};
    if (options.role) {
      filter.role = options.role;
    }
    return userRepository.findAll(filter, options);
  }

  async getUserById(id: string): Promise<IUser | null> {
    return userRepository.findById(id);
  }

  async deleteUser(id: string): Promise<IUser | null> {
    return userRepository.delete(id);
  }

  /**
   * Permanently delete the authenticated user's account and all associated personal
   * data (profiles, kundalis, chat history, usage). Backs the /data-deletion policy
   * and satisfies the App Store / Google Play account-deletion requirement.
   *
   * Transaction/billing records are intentionally retained for legal & tax purposes,
   * but they no longer link to any profile or chart data.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await Promise.all([
      Profile.deleteMany({ userId }),
      Kundali.deleteMany({ userId }),
      ChatSession.deleteMany({ userId }),
      UserUsage.deleteMany({ userId }),
    ]);

    await userRepository.delete(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.password) {
      throw new ApiError(401, 'This account uses Google login. Password reset is not available.');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    return true;
  }

  // Returns the OTP only when it should actually be emailed. Returns null when the
  // account does not exist or is a Google account — the controller responds with a
  // generic message either way, so an attacker cannot enumerate registered emails.
  async forgotPassword(email: string): Promise<string | null> {
    const user = await userRepository.findByEmail(email);
    if (!user || user.authProvider === 'google') {
      return null;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.update(user._id.toString(), {
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: expiry,
      isOtpVerified: false,
    });

    return otp;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }

    if (user.resetPasswordOTPExpires && user.resetPasswordOTPExpires < new Date()) {
      throw new ApiError(400, 'OTP has expired');
    }

    await userRepository.update(user._id.toString(), {
      isOtpVerified: true,
    });

    return true;
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ user: IUser; token: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.isOtpVerified || user.resetPasswordOTP !== otp) {
      throw new ApiError(400, 'OTP not verified or invalid');
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await userRepository.update(user._id.toString(), {
      password: hashedPassword,
      resetPasswordOTP: undefined,
      resetPasswordOTPExpires: undefined,
      isOtpVerified: false,
      isActive: true, // Ensure user is active after reset
    });

    if (!updatedUser) throw new ApiError(500, 'Failed to update password');

    const token = generateToken({
      userId: updatedUser._id.toString(),
      email: updatedUser.email || updatedUser.phone || '',
      role: updatedUser.role,
    });

    return { user: updatedUser, token };
  }

  async resendSignupOTP(email?: string, phone?: string): Promise<{ emailOtp?: string; phoneOtp?: string; email?: string; phone?: string }> {
    let user = null;
    if (email) {
      user = await userRepository.findByEmail(email);
    } else if (phone) {
      user = await userRepository.findByPhone(phone);
    }

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.isActive) {
      throw new ApiError(400, 'Account is already active');
    }

    const emailOtp = user.email ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const phoneOtp = (!user.email && user.phone) ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await userRepository.update(user._id.toString(), {
      emailOTP: emailOtp,
      emailOTPExpires: otpExpires,
      phoneOTP: phoneOtp,
      phoneOTPExpires: otpExpires,
    });

    return { 
      emailOtp, 
      phoneOtp,
      email: user.email,
      phone: user.phone
    };
  }
}

export const userService = new UserService();
