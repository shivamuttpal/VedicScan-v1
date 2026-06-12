import mongoose, { Document, Schema } from 'mongoose';

export interface IKundaliInsights {
  ascendant: string;
  moonSign: string;
  moonNakshatra: string;
  sunSign: string;
  planetSigns: Record<string, string>;
  planetHouses: Record<string, number>;
  retrograde: Record<string, boolean>;
  yogas: string[];
  doshas: string[];
  currentMahadasha: string;
  mahadashaEndDate: string;
  currentAntardasha: string;
  antardashaEndDate: string;
  manglik: boolean;
  kalsarpa: boolean;
  sadeSati: boolean;
  sadeSatiPhase?: string;
  computedAt: Date;
}

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  relationship: string;
  isDefault: boolean;
  kundaliInsights?: IKundaliInsights;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    timeOfBirth: { type: String, required: true },
    placeOfBirth: { type: String, required: true },
    relationship: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    kundaliInsights: {
      type: new Schema({
        ascendant:        { type: String },
        moonSign:         { type: String },
        moonNakshatra:    { type: String },
        sunSign:          { type: String },
        planetSigns:      { type: Schema.Types.Mixed },
        planetHouses:     { type: Schema.Types.Mixed },
        retrograde:       { type: Schema.Types.Mixed },
        yogas:            [{ type: String }],
        doshas:           [{ type: String }],
        currentMahadasha:  { type: String },
        mahadashaEndDate:  { type: String },
        currentAntardasha: { type: String },
        antardashaEndDate: { type: String },
        manglik:          { type: Boolean },
        kalsarpa:         { type: Boolean },
        sadeSati:         { type: Boolean },
        sadeSatiPhase:    { type: String },
        computedAt:       { type: Date },
      }, { _id: false }),
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
