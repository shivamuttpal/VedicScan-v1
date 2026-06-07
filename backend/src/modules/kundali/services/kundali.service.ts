import { spawn } from 'child_process';
import * as https from 'https';
import path from 'path';
import mongoose from 'mongoose';
import { Kundali, IKundali } from '../model/kundali.model';
import { detectYogas } from './yoga.service';
import { detectDoshas } from './dosha.service';
import { generateInterpretations, generateInterpretationsHi } from './interpretation.service';

const KUNDALI_BRIDGE   = path.join(process.cwd(), 'astrologyCalculation', 'kundali_bridge.py');
const SADE_SATI_BRIDGE = path.join(process.cwd(), 'astrologyCalculation', 'sade_sati.py');
const PYTHON_CMD       = process.platform === 'win32' ? 'python' : 'python3';

// In-memory geocode cache — avoids hammering Nominatim on repeated requests
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export interface GenerateKundaliInput {
  userId: string;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  timezoneOffset?: number;
  forceRegenerate?: boolean;
}

// ── Geocoding (Nominatim / OpenStreetMap) ────────────────────────────────────
// Text place name → { lat, lon }.
// Nominatim is free, globally accurate, and requires only a User-Agent header.
// For production at scale, swap in Google Maps or Positionstack with an API key.
function geocode(place: string): Promise<{ lat: number; lon: number }> {
  const cached = geocodeCache.get(place.trim().toLowerCase());
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(place.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=0`;

    const req = https.get(
      url,
      { headers: { 'User-Agent': 'VedicScan/2.0 (astrology@vedicscan.app)' } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!Array.isArray(data) || data.length === 0) {
              return reject(
                new Error(
                  `Cannot geocode "${place}". Try a more specific name (e.g., "Mumbai, India").`
                )
              );
            }
            const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            geocodeCache.set(place.trim().toLowerCase(), result);
            resolve(result);
          } catch {
            reject(new Error('Geocoding response could not be parsed'));
          }
        });
      }
    );
    req.on('error', (err) => reject(new Error(`Geocoding network error: ${err.message}`)));
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Geocoding timed out after 12 s. Check internet connectivity.'));
    });
  });
}

// ── Python bridge runner ──────────────────────────────────────────────────────
function runKundaliBridge(input: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [KUNDALI_BRIDGE]);
    let stdout = '';
    let stderr = '';

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();

    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Kundali engine timed out after 30 s'));
    }, 30000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`Engine error: ${stderr.slice(0, 400) || 'unknown'}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid JSON from engine: ' + stdout.slice(0, 300)));
      }
    });
  });
}

// ── Sade Sati bridge — lightweight call using only moon_sign_id + dob ─────────
function runSadeSatiBridge(moonSignId: number, dob: string, tob: string, tzOffset: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [SADE_SATI_BRIDGE]);
    let stdout = '';
    let stderr = '';

    proc.stdin.write(JSON.stringify({ moon_sign_id: moonSignId, dob, tob, tz_offset: tzOffset }));
    proc.stdin.end();

    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => { proc.kill(); resolve(null); }, 45000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) { resolve(null); return; }
      try { resolve(JSON.parse(stdout)); }
      catch { resolve(null); }
    });
  });
}

// ── Planet normalisation ──────────────────────────────────────────────────────
// Maps raw Python planet dict → the shape stored in MongoDB (IPlanetData).
// Handles both the updated engine field names and older fallback names.
function normalizePlanets(rawPlanets: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [name, p] of Object.entries(rawPlanets)) {
    out[name] = {
      // Core position
      rashi:         p.rashi          || 'Unknown',
      nakshatra:     p.nakshatra      || 'Unknown',
      degree:        parseFloat(((p.degree_in_rashi ?? p.degree ?? 0)).toFixed(4)),
      absoluteDegree: parseFloat((p.absolute_degree ?? 0).toFixed(4)),
      pada:          p.pada           ?? null,
      houseNumber:   p.houseNumber    ?? 1,
      navamsaSign:   p.navamsaSign    || 'Aries',
      // New accuracy fields (updated engine)
      isRetrograde:  p.retrograde     ?? p.is_retrograde  ?? false,
      dignity:       p.dignity        || 'Neutral Sign',
      nakshatraLord: p.nakshatra_lord || '',
      rashiLord:     p.rashi_lord     || p.sign_lord      || '',
      dms:           p.dms            || '',
    };
  }
  return out;
}

// ── Main service ─────────────────────────────────────────────────────────────
export const kundaliService = {

  async generate(input: GenerateKundaliInput): Promise<IKundali> {
    const {
      userId, name, dateOfBirth, timeOfBirth, placeOfBirth,
      timezoneOffset = 5.5, forceRegenerate = false,
    } = input;

    // Return cached kundali for same birth details unless forced
    if (!forceRegenerate) {
      const existing = await Kundali.findOne({
        userId:      new mongoose.Types.ObjectId(userId),
        dateOfBirth,
        placeOfBirth,
      }).sort({ createdAt: -1 });
      if (existing) return existing;
    }

    // Step 1 — geocode the text place name
    const { lat, lon } = await geocode(placeOfBirth);

    // Step 2 — run the Python Vedic engine
    const pyResult = await runKundaliBridge({
      dob:       dateOfBirth,
      tob:       timeOfBirth,
      lat,
      lon,
      tz_offset: timezoneOffset,
    });

    if (pyResult.status !== 'success') {
      throw new Error(pyResult.message || 'Kundali engine returned an error status');
    }

    // Step 3 — unpack engine output
    const { chart_data, navamsa_data, dasha_data, sade_sati_data } = pyResult;
    const rawPlanets = chart_data.Planets as Record<string, any>;
    const planets    = normalizePlanets(rawPlanets);

    const moon      = planets['Moon'];
    const sun       = planets['Sun'];
    // New engine uses Lagna.sign; keep fallback for any cached old-format result
    const lagnaSign: string = chart_data.Lagna.sign ?? chart_data.Lagna.rashi ?? 'Aries';

    // Houses — engine already returns array with sign_lord
    const houses: Array<{ number: number; sign: string; signLord?: string; planets: string[] }> =
      Array.isArray(chart_data.Houses)
        ? chart_data.Houses.map((h: any) => ({
            number:   h.number,
            sign:     h.sign,
            signLord: h.sign_lord || h.signLord || '',
            planets:  h.planets || [],
          }))
        : [];

    // Step 4 — yoga & dosha detection
    const planetForRules = Object.fromEntries(
      Object.entries(planets).map(([k, v]: [string, any]) => [
        k,
        { rashi: v.rashi, houseNumber: v.houseNumber },
      ])
    );
    const yogas  = detectYogas(planetForRules, lagnaSign, houses);
    const doshas = detectDoshas(planetForRules, lagnaSign, houses);

    // Step 5 — generate text interpretations (both languages)
    const sharedArgs: [
      string, string, string, string, string,
      Record<string, { rashi: string; houseNumber: number }>,
      string, string, any[], any[]
    ] = [
      name,
      lagnaSign,
      moon?.rashi        || 'Aries',
      moon?.nakshatra    || 'Ashwini',
      sun?.rashi         || 'Aries',
      planetForRules,
      dasha_data.current_mahadasha  || 'Jupiter',
      dasha_data.current_antardasha || 'Jupiter',
      yogas,
      doshas,
    ];
    const interpretations   = generateInterpretations(...sharedArgs);
    const interpretationsHi = generateInterpretationsHi(...sharedArgs);

    // Step 6 — build dasha document.
    // The first mahadasha may have started before birth (birth balance residual).
    // Trim its display start to actual birth date so the PDF shows "from birth" not a pre-birth year.
    const rawTimeline: any[] = dasha_data.timeline || [];
    const timeline = rawTimeline.map((md: any, idx: number) => {
      if (idx === 0 && md.startDate && md.startDate < dateOfBirth) {
        return { ...md, startDate: dateOfBirth, isBalanceAtBirth: true };
      }
      return md;
    });
    const dasha = {
      currentMahadasha:  dasha_data.current_mahadasha  || '',
      mahadashaStartDate: dasha_data.mahadasha_start_date || '',
      mahadashaEndDate:  dasha_data.mahadasha_end_date  || '',
      currentAntardasha: dasha_data.current_antardasha  || '',
      antardashaStartDate: dasha_data.antardasha_start_date || '',
      antardashaEndDate: dasha_data.antardasha_end_date  || '',
      currentPratyantar: dasha_data.current_pratyantar  ?? null,
      pratyantarEndDate: dasha_data.pratyantar_end_date ?? null,
      timeline,
    };

    // Step 7 — persist to MongoDB
    const lagnaDeg = parseFloat((chart_data.Lagna.degree ?? chart_data.Lagna.degree_in_rashi ?? 0).toFixed(4));
    const lagnaAbsDeg = parseFloat((chart_data.Lagna.absolute_degree ?? 0).toFixed(4));

    const kundali = new Kundali({
      userId:        new mongoose.Types.ObjectId(userId),
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      latitude:      lat,
      longitude:     lon,
      timezoneOffset,
      generatedAt:   new Date(),
      lagna: {
        sign:          lagnaSign,
        degree:        lagnaDeg,
        absoluteDegree: lagnaAbsDeg,
        navamsaSign:   chart_data.Lagna.navamsaSign || '',
      },
      moonSign:      moon?.rashi     || 'Aries',
      moonNakshatra: moon?.nakshatra || 'Ashwini',
      moonPada:      moon?.pada      || 1,
      sunSign:       sun?.rashi      || 'Aries',
      planets,
      houses,
      navamsa: {
        lagnaSign: navamsa_data?.lagnaSign || navamsa_data?.lagna_sign || '',
        planets:   navamsa_data?.planets   || {},
      },
      yogas,
      doshas,
      dasha,
      sadeSati: sade_sati_data?.status === 'success' ? sade_sati_data : undefined,
      interpretations,
      interpretationsHi,
    });

    await kundali.save();
    return kundali;
  },

  async getById(kundaliId: string, userId: string): Promise<IKundali | null> {
    const kundali = await Kundali.findOne({
      _id:    new mongoose.Types.ObjectId(kundaliId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Lazily generate Hindi interpretations for kundalis created before the feature existed
    if (kundali && !(kundali as any).interpretationsHi) {
      try {
        const plain = kundali.toObject() as any;
        const planetsMap = plain.planets || {};
        const planetForRules: Record<string, { rashi: string; houseNumber: number }> = {};
        for (const [pname, pdata] of Object.entries(planetsMap)) {
          planetForRules[pname] = {
            rashi:       (pdata as any).rashi       || 'Aries',
            houseNumber: (pdata as any).houseNumber || 1,
          };
        }

        const interpretationsHi = generateInterpretationsHi(
          plain.name,
          plain.lagna?.sign      || 'Aries',
          plain.moonSign         || 'Aries',
          plain.moonNakshatra    || 'Ashwini',
          plain.sunSign          || 'Aries',
          planetForRules,
          plain.dasha?.currentMahadasha  || 'Jupiter',
          plain.dasha?.currentAntardasha || 'Jupiter',
          plain.yogas  || [],
          plain.doshas || [],
        );

        await Kundali.updateOne({ _id: kundali._id }, { $set: { interpretationsHi } });
        (kundali as any).interpretationsHi = interpretationsHi;
      } catch (e) {
        console.warn('[kundali] lazy Hindi generation failed:', (e as any).message);
      }
    }

    // Lazily compute Sade Sati for kundalis created before this feature was added
    if (kundali && !(kundali as any).sadeSati) {
      try {
        const plain = kundali.toObject() as any;
        // Moon's rashi_id: index in RASHIS array (1-based)
        const RASHIS_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                              'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        const moonSignId = RASHIS_ORDER.indexOf(plain.moonSign) + 1;
        if (moonSignId > 0) {
          const ssData = await runSadeSatiBridge(
            moonSignId,
            plain.dateOfBirth,
            plain.timeOfBirth || '12:00',
            plain.timezoneOffset ?? 5.5,
          );
          if (ssData?.status === 'success') {
            await Kundali.updateOne({ _id: kundali._id }, { $set: { sadeSati: ssData } });
            (kundali as any).sadeSati = ssData;
          }
        }
      } catch (e) {
        console.warn('[kundali] lazy Sade Sati generation failed:', (e as any).message);
      }
    }

    return kundali;
  },

  async getByUser(userId: string): Promise<IKundali[]> {
    return Kundali.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .select('-dasha.timeline -interpretations -interpretationsHi');
  },

  async deleteById(kundaliId: string, userId: string): Promise<boolean> {
    const res = await Kundali.deleteOne({
      _id:    new mongoose.Types.ObjectId(kundaliId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return res.deletedCount > 0;
  },
};
