/**
 * chartEngine.service — shared access to the Python Vedic engine.
 *
 * Extracts the geocoding + Python-bridge logic that was previously private to
 * chart.controller so other modules (e.g. compatibility → Manglik detection)
 * can compute a full sidereal chart without duplicating the plumbing.
 */
import { spawn } from 'child_process';
import * as https from 'https';
import path from 'path';

const BRIDGE_SCRIPT = path.join(process.cwd(), 'astrologyCalculation', 'chart_bridge.py');
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// In-memory geocode cache — avoids repeat Nominatim hits for the same place.
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export function geocode(place: string): Promise<{ lat: number; lon: number }> {
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
          if (!data.length) return reject(new Error(`Cannot geocode: ${place}`));
          const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          geocodeCache.set(place, result);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Geocode request timed out')); });
  });
}

export function runPythonBridge(input: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [BRIDGE_SCRIPT]);
    let stdout = '';
    let stderr = '';

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Python engine timed out'));
    }, 20000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr || 'Python process exited with error'));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid JSON from Python engine: ' + stdout.slice(0, 200)));
      }
    });
  });
}

/**
 * Compute a full sidereal chart for a set of birth details.
 * Returns the raw engine payload ({ chart_data, dasha_data, meta }).
 */
export async function calculateFullChart(input: {
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  timezoneOffset?: number;
}): Promise<any> {
  const { lat, lon } = await geocode(input.placeOfBirth);
  const pyResult = await runPythonBridge({
    dob: input.dateOfBirth,
    tob: input.timeOfBirth || '12:00',
    lat,
    lon,
    tz_offset: input.timezoneOffset ?? 5.5,
  });
  if (pyResult.status !== 'success') {
    throw new Error(pyResult.message || 'Engine returned non-success status');
  }
  return pyResult;
}

export interface MarsContext {
  house: number;      // Mars whole-sign house from Lagna (1–12)
  rashi: string;      // Mars sign (English, e.g. "Aries")
  lagnaSign: string;  // Ascendant sign (English)
}

/**
 * Best-effort: return Mars's house/sign context needed for Manglik detection,
 * or null if the chart cannot be computed (bad place, engine offline, timeout).
 * Never throws — callers can treat null as "Manglik status unavailable".
 */
export async function getMarsContext(input: {
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  timezoneOffset?: number;
}): Promise<MarsContext | null> {
  try {
    if (!input?.dateOfBirth || !input?.placeOfBirth) return null;
    const pyResult = await calculateFullChart(input);
    const mars = pyResult?.chart_data?.Planets?.Mars;
    const lagna = pyResult?.chart_data?.Lagna;
    if (!mars || typeof mars.houseNumber !== 'number') return null;
    return {
      house: mars.houseNumber,
      rashi: mars.rashi,
      lagnaSign: lagna?.sign ?? '',
    };
  } catch {
    return null;
  }
}
