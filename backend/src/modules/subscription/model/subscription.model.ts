import mongoose, { Document, Schema } from 'mongoose';

export interface IUserUsage extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'standard' | 'premium';

  // Daily tracking
  dailyQuestionsUsed: number;
  dailyTokensUsed: number;
  lastDailyReset: Date;

  // Monthly tracking
  monthlyQuestionsUsed: number;
  monthlyTokensUsed: number;
  lastMonthlyReset: Date;

  // OpenAI Thread mapping: conversationId → OpenAI threadId
  threadMap: Map<string, string>;

  // Cumulative token tracking (for cost monitoring)
  totalPromptTokens: number;
  totalCompletionTokens: number;

  // Subscription metadata
  planStartDate: Date;
  planEndDate?: Date;
  billingCycle: 'monthly' | 'annual' | 'none';
  previousPlan?: string;

  // Email notification tracking
  expiryWarningNotified: boolean;
  expiryNotified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userUsageSchema = new Schema<IUserUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'standard', 'premium'],
      default: 'free',
    },

    // Daily tracking
    dailyQuestionsUsed: { type: Number, default: 0 },
    dailyTokensUsed: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },

    // Monthly tracking
    monthlyQuestionsUsed: { type: Number, default: 0 },
    monthlyTokensUsed: { type: Number, default: 0 },
    lastMonthlyReset: { type: Date, default: Date.now },

    // OpenAI Thread mapping
    threadMap: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Cumulative token tracking
    totalPromptTokens: { type: Number, default: 0 },
    totalCompletionTokens: { type: Number, default: 0 },

    // Subscription metadata
    planStartDate: { type: Date, default: Date.now },
    planEndDate: { type: Date },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'none'],
      default: 'none',
    },
    previousPlan: { type: String },

    // Email notification tracking
    expiryWarningNotified: { type: Boolean, default: false },
    expiryNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Helper: Get IST midnight for today
export function getISTMidnight(): Date {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istMidnight = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
  );
  // Convert back to UTC by subtracting IST offset
  return new Date(istMidnight.getTime() - istOffset);
}

// Helper: Get IST 1st of current month midnight
export function getISTMonthStart(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istMonthStart = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1)
  );
  return new Date(istMonthStart.getTime() - istOffset);
}

export const UserUsage = mongoose.model<IUserUsage>('UserUsage', userUsageSchema);
