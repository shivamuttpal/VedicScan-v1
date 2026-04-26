import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'instructor' | 'student' | 'user';
  isActive: boolean;
  profileImage?: string;
  phone?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
  isOtpVerified?: boolean;
  emailOTP?: string;
  emailOTPExpires?: Date;
  isEmailVerified?: boolean;
  phoneOTP?: string;
  phoneOTPExpires?: Date;
  isPhoneVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'instructor', 'student', 'user'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    resetPasswordOTP: {
      type: String,
    },
    resetPasswordOTPExpires: {
      type: Date,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    emailOTP: {
      type: String,
    },
    emailOTPExpires: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneOTP: {
      type: String,
    },
    phoneOTPExpires: {
      type: Date,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        const { password, __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Indexes
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
