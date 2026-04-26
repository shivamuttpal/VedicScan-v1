import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(['admin', 'instructor', 'student', 'user']).optional(),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required for registration",
    path: ["email"],
  }),
});

export const verifySignupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided to verify OTP",
    path: ["email"],
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: z.string().min(1, 'Phone number is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required to login",
    path: ["email"],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    profileImage: z.string().url().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required to resend OTP",
    path: ["email"],
  }),
});
