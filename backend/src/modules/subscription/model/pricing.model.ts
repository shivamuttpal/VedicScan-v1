import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingConfig extends Document {
  planId: string;
  displayName: string;
  INR: { monthly: number; annual: number };
  USD: { monthly: number; annual: number };
  isActive: boolean;
}

const PricingConfigSchema = new Schema<IPricingConfig>(
  {
    planId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    INR: {
      monthly: { type: Number, required: true },
      annual: { type: Number, required: true },
    },
    USD: {
      monthly: { type: Number, required: true },
      annual: { type: Number, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PricingConfig = mongoose.model<IPricingConfig>('PricingConfig', PricingConfigSchema);

// Default values (amounts in major currency units — ₹ / $)
// Seeded automatically on first GET /api/subscription/pricing call.
// To change prices: update the DB document directly (Mongo Atlas / compass).
export const DEFAULT_PRICING = [
  {
    planId: 'standard',
    displayName: 'Standard',
    INR: { monthly: 149, annual: 1499 },
    USD: { monthly: 9, annual: 49 },
    isActive: true,
  },
  {
    planId: 'premium',
    displayName: 'VedicScan Pro',
    INR: { monthly: 299, annual: 2999 },
    USD: { monthly: 19, annual: 99 },
    isActive: true,
  },
];
