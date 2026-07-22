/**
 * Feature Catalogue
 *
 * The authoritative list of gateable capabilities in the product. A plan grants
 * limits *by reference* to these feature keys, so adding a new premium feature
 * is a data operation:
 *
 *   1. Insert a Feature document with a new `key`.
 *   2. Add an entitlement referencing that key to whichever plans should include it.
 *   3. Apply `requireEntitlement('<key>')` to the route.
 *
 * No business logic changes. The usage engine treats every feature identically
 * and derives its reset behaviour from the plan entitlement's `period`.
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { PeriodType } from '../utils/period.util';

export interface IFeature extends Document {
  /** Stable machine key referenced by plans, middleware and usage counters. */
  key: string;
  /** Human-readable name, safe to show in paywall/upgrade UI. */
  displayName: string;
  description?: string;
  /**
   * Default reset window when a plan does not override it. The plan entitlement
   * is authoritative; this exists so a feature has sane behaviour if a plan
   * omits the field.
   */
  defaultPeriod: PeriodType;
  /**
   * Whether an Add-on Pack may grant extra units of this feature. Prevents a
   * consumable pack from accidentally topping up something meaningless
   * (e.g. rashifal notifications).
   */
  addonEligible: boolean;
  /** Soft-delete / hide without breaking historical usage rows. */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema<IFeature>(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    defaultPeriod: {
      type: String,
      enum: ['daily', 'monthly', 'lifetime', 'none'],
      default: 'monthly',
    },
    addonEligible: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Feature = mongoose.model<IFeature>('Feature', featureSchema);
