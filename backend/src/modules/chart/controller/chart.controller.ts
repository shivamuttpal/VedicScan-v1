import { Request, Response } from 'express';
import { spawn } from 'child_process';
import * as https from 'https';
import path from 'path';

const BRIDGE_SCRIPT = path.join(process.cwd(), 'astrologyCalculation', 'chart_bridge.py');
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// In-memory geocode cache — avoids repeat Nominatim hits for same place
const geocodeCache = new Map<string, { lat: number; lon: number }>();

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

function runPythonBridge(input: object): Promise<any> {
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

export const chartController = {
  async calculateChart(req: Request, res: Response) {
    try {
      const { dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset } = req.body;

      // Resolve place name → lat/lon
      const { lat, lon } = await geocode(placeOfBirth);

      // Run the Vedic engine via Python bridge
      const pyResult = await runPythonBridge({
        dob: dateOfBirth,
        tob: timeOfBirth,
        lat,
        lon,
        tz_offset: timezoneOffset ?? 5.5,
      });

      if (pyResult.status !== 'success') {
        throw new Error(pyResult.message || 'Engine returned non-success status');
      }

      const { chart_data, dasha_data, meta } = pyResult;
      const moonPlanet = chart_data.Planets.Moon;

      // Normalize all planets to a flat, consistent shape
      const planets: Record<string, any> = {};
      for (const [name, p] of Object.entries<any>(chart_data.Planets)) {
        planets[name] = {
          rashi: p.rashi,
          nakshatra: p.nakshatra,
          degree: parseFloat((p.degree_in_rashi ?? p.absolute_degree).toFixed(4)),
          pada: p.pada ?? null,
          absolute_degree: parseFloat(p.absolute_degree.toFixed(4)),
        };
      }

      res.json({
        success: true,
        // Kept for backward-compat with existing frontend / mobile consumers
        moon: {
          sign_vedic: moonPlanet.rashi,
          nakshatra: moonPlanet.nakshatra,
          degree: parseFloat(moonPlanet.degree_in_rashi.toFixed(4)),
          pada: moonPlanet.pada,
        },
        lagna: {
          sign: chart_data.Lagna.sign,
          degree: parseFloat(chart_data.Lagna.degree.toFixed(4)),
        },
        planets,
        dasha_data,
        meta: {
          current_date: meta.current_date,
          current_weekday: meta.current_weekday,
        },
      });
    } catch (error: any) {
      console.error('[chart] calculation error:', error.message);
      res.status(500).json({ success: false, message: 'Chart calculation failed' });
    }
  },
};
