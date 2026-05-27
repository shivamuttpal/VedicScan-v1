import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type PurchaseSource = 'stripe' | 'apple' | 'google';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  revenueCatEventId?: string;
  purchaseSource: PurchaseSource;
  amount: number; // in paise/cents
  currency: string;
  plan: string;
  billingCycle: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String },
    revenueCatEventId: { type: String },
    purchaseSource: { type: String, enum: ['stripe', 'apple', 'google'], default: 'stripe' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    plan: { type: String, required: true },
    billingCycle: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
