import { spawn } from 'child_process';
import * as https from 'https';
import path from 'path';
import mongoose from 'mongoose';
import { Kundali, IKundali } from '../model/kundali.model';
import { detectYogas } from './yoga.service';
import { detectDoshas } from './dosha.service';
import { generateInterpretations } from './interpretation.service';

const KUNDALI_BRIDGE = path.join(process.cwd(), 'astrologyCalculation', 'kundali_bridge.py');
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// In-memory geocode cache (persists across requests in the same process)
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

function geocode(place: string): Promise<{ lat: number; lon: number }> {
  const cached = geocodeCache.get(place);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
    const req = https.get(url, { headers: { 'User-Agent': 'VedicScan/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.length) return reject(new Error(`Cannot geocode: "${place}"`));
          const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          geocodeCache.set(place, result);
          resolve(result);
        } catch (e) {
          reject(new Error('Geocoding response parse error'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Geocoding timed out')); });
  });
}

function runKundaliBridge(input: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [KUNDALI_BRIDGE]);
    let stdout = '';
    let stderr = '';

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => { proc.kill(); reject(new Error('Kundali engine timed out after 30s')); }, 30000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr || 'Python process failed'));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid JSON from kundali engine: ' + stdout.slice(0, 300)));
      }
    });
  });
}

function normalizePlanets(rawPlanets: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [name, p] of Object.entries(rawPlanets)) {
    normalized[name] = {
      rashi: p.rashi || 'Unknown',
      nakshatra: p.nakshatra || 'Unknown',
      degree: parseFloat(((p.degree_in_rashi ?? p.degree ?? 0)).toFixed(4)),
      absoluteDegree: parseFloat((p.absolute_degree ?? 0).toFixed(4)),
      pada: p.pada ?? null,
      houseNumber: p.houseNumber ?? 1,
      navamsaSign: p.navamsaSign || 'Aries',
    };
  }
  return normalized;
}

export const kundaliService = {
  async generate(input: GenerateKundaliInput): Promise<IKundali> {
    const { userId, name, dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset = 5.5, forceRegenerate = false } = input;

    // Return cached kundali if same birth details exist and not forced
    if (!forceRegenerate) {
      const existing = await Kundali.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        dateOfBirth,
        placeOfBirth,
      }).sort({ createdAt: -1 });
      if (existing) return existing;
    }

    // Geocode birth place
    const { lat, lon } = await geocode(placeOfBirth);

    // Run extended Python kundali engine
    const pyResult = await runKundaliBridge({
      dob: dateOfBirth,
      tob: timeOfBirth,
      lat,
      lon,
      tz_offset: timezoneOffset,
    });

    if (pyResult.status !== 'success') {
      throw new Error(pyResult.message || 'Kundali engine returned error');
    }

    const { chart_data, navamsa_data, dasha_data } = pyResult;
    const rawPlanets = chart_data.Planets;
    const planets = normalizePlanets(rawPlanets);

    const moon = planets['Moon'];
    const sun = planets['Sun'];
    const lagnaSign: string = chart_data.Lagna.sign;

    // Build houses array (handle both array and map)
    const houses: Array<{ number: number; sign: string; planets: string[] }> =
      Array.isArray(chart_data.Houses)
        ? chart_data.Houses
        : Object.values(chart_data.Houses || {});

    // Detect yogas and doshas
    const planetForRules = Object.fromEntries(
      Object.entries(planets).map(([k, v]: [string, any]) => [k, { rashi: v.rashi, houseNumber: v.houseNumber }])
    );
    const yogas = detectYogas(planetForRules, lagnaSign, houses);
    const doshas = detectDoshas(planetForRules, lagnaSign, houses);

    // Generate interpretations
    const interpretations = generateInterpretations(
      name,
      lagnaSign,
      moon?.rashi || 'Aries',
      moon?.nakshatra || 'Ashwini',
      sun?.rashi || 'Aries',
      planetForRules,
      dasha_data.current_mahadasha || 'Jupiter',
      dasha_data.current_antardasha || 'Jupiter',
      yogas,
      doshas
    );

    // Build dasha document
    const dasha = {
      currentMahadasha: dasha_data.current_mahadasha || '',
      mahadashaStartDate: dasha_data.mahadasha_start_date || '',
      mahadashaEndDate: dasha_data.mahadasha_end_date || '',
      currentAntardasha: dasha_data.current_antardasha || '',
      antardashaStartDate: dasha_data.antardasha_start_date || '',
      antardashaEndDate: dasha_data.antardasha_end_date || '',
      currentPratyantar: dasha_data.current_pratyantar || null,
      pratyantarEndDate: dasha_data.pratyantar_end_date || null,
      timeline: dasha_data.timeline || [],
    };

    // Save to MongoDB
    const kundali = new Kundali({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      latitude: lat,
      longitude: lon,
      timezoneOffset,
      generatedAt: new Date(),
      lagna: {
        sign: lagnaSign,
        degree: parseFloat((chart_data.Lagna.degree || 0).toFixed(4)),
        absoluteDegree: parseFloat((chart_data.Lagna.absolute_degree || 0).toFixed(4)),
        navamsaSign: chart_data.Lagna.navamsaSign || '',
      },
      moonSign: moon?.rashi || 'Aries',
      moonNakshatra: moon?.nakshatra || 'Ashwini',
      moonPada: moon?.pada || 1,
      sunSign: sun?.rashi || 'Aries',
      planets,
      houses,
      navamsa: {
        lagnaSign: navamsa_data?.lagnaSign || '',
        planets: navamsa_data?.planets || {},
      },
      yogas,
      doshas,
      dasha,
      interpretations,
    });

    await kundali.save();
    return kundali;
  },

  async getById(kundaliId: string, userId: string): Promise<IKundali | null> {
    return Kundali.findOne({
      _id: new mongoose.Types.ObjectId(kundaliId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  },

  async getByUser(userId: string): Promise<IKundali[]> {
    return Kundali.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .select('-dasha.timeline -interpretations');
  },

  async deleteById(kundaliId: string, userId: string): Promise<boolean> {
    const res = await Kundali.deleteOne({
      _id: new mongoose.Types.ObjectId(kundaliId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return res.deletedCount > 0;
  },
};
