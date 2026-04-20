import mongoose, { Schema, Document } from 'mongoose';

export interface IRashifal extends Document {
  sign: string;
  prediction: string;
  date: string; // YYYY-MM-DD format for easy querying
  dayOfWeek: string;
  lord?: string;
  element?: string;
  createdAt: Date;
}

const RashifalSchema: Schema = new Schema({
  sign: { type: String, required: true },
  prediction: { type: String, required: true },
  date: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  lord: { type: String },
  element: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 86400 * 2 } // TTL index for 2 days
});

// Compound index for unique sign per date
RashifalSchema.index({ sign: 1, date: 1 }, { unique: true });

export default mongoose.model<IRashifal>('Rashifal', RashifalSchema);
