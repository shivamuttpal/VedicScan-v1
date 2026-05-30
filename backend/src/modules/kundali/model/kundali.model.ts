import mongoose, { Document, Schema } from 'mongoose';

export interface IPlanetData {
  rashi: string;
  nakshatra: string;
  degree: number;
  absoluteDegree: number;
  pada: number | null;
  houseNumber: number;
  navamsaSign: string;
}

export interface IHouse {
  number: number;
  sign: string;
  planets: string[];
}

export interface IYoga {
  name: string;
  strength: 'Strong' | 'Moderate' | 'Weak';
  description: string;
  isPresent: boolean;
}

export interface IDosha {
  name: string;
  severity: 'High' | 'Medium' | 'Low' | 'None';
  description: string;
  isPresent: boolean;
  remedy: string;
}

export interface IAntardasha {
  planet: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface IMahadasha {
  planet: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  antardashas: IAntardasha[];
}

export interface IDasha {
  currentMahadasha: string;
  mahadashaStartDate: string;
  mahadashaEndDate: string;
  currentAntardasha: string;
  antardashaStartDate: string;
  antardashaEndDate: string;
  currentPratyantar: string | null;
  pratyantarEndDate: string | null;
  timeline: IMahadasha[];
}

export interface IInterpretations {
  personality: string;
  career: string;
  finance: string;
  marriage: string;
  health: string;
  education: string;
  spirituality: string;
  children: string;
  strengths: string[];
  challenges: string[];
  mantras: string[];
  gemstones: string[];
  fastingDays: string[];
  charities: string[];
}

export interface IKundali extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  generatedAt: Date;
  lagna: { sign: string; degree: number; absoluteDegree: number; navamsaSign: string };
  moonSign: string;
  moonNakshatra: string;
  moonPada: number;
  sunSign: string;
  planets: Record<string, IPlanetData>;
  houses: IHouse[];
  navamsa: {
    lagnaSign: string;
    planets: Record<string, { sign: string; houseNumber: number }>;
  };
  yogas: IYoga[];
  doshas: IDosha[];
  dasha: IDasha;
  interpretations: IInterpretations;
}

const PlanetDataSchema = new Schema<IPlanetData>({
  rashi: String,
  nakshatra: String,
  degree: Number,
  absoluteDegree: Number,
  pada: Number,
  houseNumber: Number,
  navamsaSign: String,
}, { _id: false });

const HouseSchema = new Schema<IHouse>({
  number: Number,
  sign: String,
  planets: [String],
}, { _id: false });

const YogaSchema = new Schema<IYoga>({
  name: String,
  strength: String,
  description: String,
  isPresent: Boolean,
}, { _id: false });

const DoshaSchema = new Schema<IDosha>({
  name: String,
  severity: String,
  description: String,
  isPresent: Boolean,
  remedy: String,
}, { _id: false });

const KundaliSchema = new Schema<IKundali>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    timeOfBirth: { type: String, required: true },
    placeOfBirth: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    timezoneOffset: { type: Number, default: 5.5 },
    generatedAt: { type: Date, default: Date.now },
    lagna: {
      sign: String,
      degree: Number,
      absoluteDegree: Number,
      navamsaSign: String,
    },
    moonSign: String,
    moonNakshatra: String,
    moonPada: Number,
    sunSign: String,
    planets: { type: Map, of: PlanetDataSchema },
    houses: [HouseSchema],
    navamsa: {
      lagnaSign: String,
      planets: { type: Map, of: { sign: String, houseNumber: Number } },
    },
    yogas: [YogaSchema],
    doshas: [DoshaSchema],
    dasha: { type: Schema.Types.Mixed },
    interpretations: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for quick lookup by user + birth details
KundaliSchema.index({ userId: 1, dateOfBirth: 1, placeOfBirth: 1 });

export const Kundali = mongoose.model<IKundali>('Kundali', KundaliSchema);
