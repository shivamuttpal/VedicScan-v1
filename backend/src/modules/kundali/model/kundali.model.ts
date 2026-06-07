import mongoose, { Document, Schema } from 'mongoose';

export interface IPlanetData {
  rashi: string;
  nakshatra: string;
  degree: number;
  absoluteDegree: number;
  pada: number | null;
  houseNumber: number;
  navamsaSign: string;
  // Extended fields from updated engine
  isRetrograde?: boolean;
  dignity?: string;          // Exalted | Debilitated | Moolatrikona | Own Sign | Friendly Sign | Enemy Sign | Neutral Sign
  nakshatraLord?: string;
  rashiLord?: string;
  dms?: string;              // Degree°Minute'Second" string for display
}

export interface IHouse {
  number: number;
  sign: string;
  signLord?: string;
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

export interface ISadeSatiPhase {
  phase: string;
  phase_sanskrit: string;
  sign: string;
  startDate: string;
  endDate: string;
  retrograde_passes: number;
  significance: string;
}

export interface ISadeSatiCycle {
  cycle_number: number;
  startDate: string;
  endDate: string;
  approx_years: number;
  is_current: boolean;
  is_past: boolean;
  phases: ISadeSatiPhase[];
}

export interface ISadeSatiDhaiyaPeriod {
  startDate: string;
  endDate: string;
  is_current: boolean;
}

export interface ISadeSati {
  moon_sign: string;
  moon_sign_sanskrit: string;
  sade_sati_signs: { twelfth_from_moon: string; moon_sign: string; second_from_moon: string };
  dhaiya_signs: { kantaka_shani_4th: string; ashtama_shani_8th: string };
  saturn_now: { sign: string; degree_in_sign: number; retrograde: boolean; as_of: string };
  current_status: {
    in_sade_sati: boolean;
    phase?: string;
    phase_sanskrit?: string;
    phase_end_date?: string;
    cycle_start_date?: string;
    cycle_end_date?: string;
    significance?: string;
    next_cycle_start_date?: string;
    next_cycle_end_date?: string;
    in_dhaiya?: { type: string; startDate: string; endDate: string } | null;
  };
  cycles: ISadeSatiCycle[];
  dhaiya: {
    kantaka_shani_4th: ISadeSatiDhaiyaPeriod[];
    ashtama_shani_8th: ISadeSatiDhaiyaPeriod[];
    current: { type: string; startDate: string; endDate: string } | null;
  };
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
  sadeSati?: ISadeSati;
  interpretations: IInterpretations;
  interpretationsHi?: IInterpretations;
}

const PlanetDataSchema = new Schema<IPlanetData>({
  rashi: String,
  nakshatra: String,
  degree: Number,
  absoluteDegree: Number,
  pada: Number,
  houseNumber: Number,
  navamsaSign: String,
  isRetrograde: Boolean,
  dignity: String,
  nakshatraLord: String,
  rashiLord: String,
  dms: String,
}, { _id: false });

const HouseSchema = new Schema<IHouse>({
  number: Number,
  sign: String,
  signLord: String,
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
    sadeSati: { type: Schema.Types.Mixed },
    interpretations: { type: Schema.Types.Mixed },
    interpretationsHi: { type: Schema.Types.Mixed },
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
