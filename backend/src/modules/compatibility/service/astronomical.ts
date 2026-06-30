/**
 * astronomical.ts — Moon Position & Nakshatra Calculator
 *
 * Algorithm: Jean Meeus, "Astronomical Algorithms" 2nd ed., Chapter 47.
 * Accuracy: ~0.1° in tropical longitude → sufficient for Nakshatra
 *           (each Nakshatra spans 13°20' = 13.333°).
 *
 * Ayanamsa: Lahiri (Chitrapaksha) — the standard used by Indian govt ephemeris
 *           and virtually all Vedic astrology software.
 *
 * Timezone: IST (+5:30) is the default (covers all Indian births).
 *           A small lookup table covers common non-Indian cities.
 */

// ─── Math helpers ─────────────────────────────────────────────────────────────
function toRad(deg: number): number { return deg * Math.PI / 180; }
function norm360(deg: number): number { return ((deg % 360) + 360) % 360; }

// ─── Julian Day Number (Meeus Ch.7) ───────────────────────────────────────────
// Handles Gregorian calendar (post 1582-Oct-15).
export function julianDay(
    year: number, month: number, day: number,
    utcHour: number, utcMinute: number
): number {
    let y = year, m = month;
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);          // Gregorian correction
    return Math.floor(365.25 * (y + 4716))
         + Math.floor(30.6001 * (m + 1))
         + day
         + utcHour / 24
         + utcMinute / 1440
         + B - 1524.5;
}

// ─── Moon tropical longitude (Meeus Ch.47, Table 47.A) ───────────────────────
// Returns degrees 0–360 (tropical ecliptic).
export function moonTropicalLongitude(jd: number): number {
    const T  = (jd - 2451545.0) / 36525.0;
    const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    // Fundamental arguments (degrees, then normalised)
    const Lp = norm360(218.3164477  + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841   - T4 / 65194000);
    const D  = norm360(297.8501921  + 445267.1114034  * T - 0.0018819 * T2 + T3 / 545868   - T4 / 113065000);
    const M  = norm360(357.5291092  + 35999.0502909   * T - 0.0001536 * T2 + T3 / 24490000);
    const Mp = norm360(134.9633964  + 477198.8675055  * T + 0.0087414 * T2 + T3 / 69699    - T4 / 14712000);
    const F  = norm360(93.2720950   + 483202.0175233  * T - 0.0036539 * T2 - T3 / 3526000  + T4 / 863310000);
    const A1 = norm360(119.75 + 131.849     * T);
    const A2 = norm360(53.09  + 479264.290  * T);

    // Eccentricity correction factor for Sun's anomaly (M) terms
    const E  = 1 - 0.002516 * T - 0.0000074 * T2;
    const E2 = E * E;

    // Table 47.A — 60 longitude terms [D, M, M', F, coeff × 10⁻⁶ degrees]
    const terms: [number, number, number, number, number][] = [
        [ 0, 0, 1, 0,  6288774], [ 2, 0,-1, 0,  1274027], [ 2, 0, 0, 0,   658314],
        [ 0, 0, 2, 0,   213618], [ 0,-1, 0, 0,  -185116], [ 0, 0, 0, 2,  -114332],
        [ 2, 0,-2, 0,    58793], [ 2,-1,-1, 0,    57066], [ 2, 0, 1, 0,    53322],
        [ 2,-1, 0, 0,    45758], [ 0, 1,-1, 0,   -40923], [ 1, 0, 0, 0,   -34720],
        [ 0, 1, 1, 0,   -30383], [ 2, 0, 0,-2,    15327], [ 0, 0, 1, 2,   -12528],
        [ 0, 0, 1,-2,    10980], [ 4, 0,-1, 0,    10675], [ 0, 0, 3, 0,    10034],
        [ 4, 0,-2, 0,     8548], [ 2, 1,-1, 0,    -7888], [ 2, 1, 0, 0,    -6766],
        [ 1, 0,-1, 0,    -5163], [ 1, 1, 0, 0,     4987], [ 2,-1, 1, 0,     4036],
        [ 2, 0, 2, 0,     3994], [ 4, 0, 0, 0,     3861], [ 2, 0,-3, 0,     3665],
        [ 0, 1,-2, 0,    -2689], [ 2, 0,-1, 2,    -2602], [ 2,-1,-2, 0,     2390],
        [ 1, 0, 1, 0,    -2348], [ 2,-2, 0, 0,     2236], [ 0, 1, 2, 0,    -2120],
        [ 0, 2, 0, 0,    -2069], [ 2,-2,-1, 0,     2048], [ 2, 0, 1,-2,    -1773],
        [ 2, 0, 0, 2,    -1595], [ 4,-1,-1, 0,     1215], [ 0, 0, 2, 2,    -1110],
        [ 3, 0,-1, 0,     -892], [ 2, 1, 1, 0,     -810], [ 4,-1,-2, 0,      759],
        [ 0, 2,-1, 0,     -713], [ 2, 2,-1, 0,     -700], [ 2, 1,-2, 0,      691],
        [ 2,-1, 0,-2,      596], [ 4, 0, 1, 0,      549], [ 0, 0, 4, 0,      537],
        [ 4,-1, 0, 0,      520], [ 1, 0,-2, 0,     -487], [ 2, 1, 0,-2,     -399],
        [ 0, 0, 2,-2,     -381], [ 1, 1, 1, 0,      351], [ 3, 0,-2, 0,     -340],
        [ 4, 0,-3, 0,      330], [ 2,-1, 2, 0,      327], [ 0, 2, 1, 0,     -323],
        [ 1, 1,-1, 0,      299], [ 2, 0, 3, 0,      294], [ 2, 0,-1,-2,        0],
    ];

    let sumL = 0;
    for (const [dD, dM, dMp, dF, cl] of terms) {
        const arg = toRad(dD * D + dM * M + dMp * Mp + dF * F);
        const eAdj = Math.abs(dM) === 2 ? E2 : Math.abs(dM) === 1 ? E : 1;
        sumL += cl * eAdj * Math.sin(arg);
    }

    // Additional fixed corrections (Meeus §47, after Table 47.A)
    sumL += 3958 * Math.sin(toRad(A1));
    sumL += 1962 * Math.sin(toRad(Lp - F));
    sumL +=  318 * Math.sin(toRad(A2));

    return norm360(Lp + sumL / 1_000_000);
}

// ─── Lahiri (Chitrapaksha) Ayanamsa ───────────────────────────────────────────
// Standard for all Indian government ephemerides and mainstream Vedic software.
// Value at J2000.0 = 23.8534°, precession rate ≈ 50.2776"/yr = 1.3966°/century.
export function lahiriAyanamsa(jd: number): number {
    const T = (jd - 2451545.0) / 36525.0;
    return 23.8534 + 1.3966 * T;
}

// ─── UTC offset lookup ────────────────────────────────────────────────────────
// Defaults to IST (+5.5) — correct for all Indian births and most users.
function utcOffsetHours(place: string): number {
    const p = (place || '').toLowerCase();
    if (/\blondon\b|united kingdom|\buk\b|england|wales|scotland|ireland/.test(p)) return 0;
    if (/paris|berlin|rome|madrid|amsterdam|brussels|vienna|zurich|stockholm/.test(p)) return 1;
    if (/cairo|helsinki|athens|bucharest|johannesburg|nairobi/.test(p)) return 2;
    if (/moscow|riyadh|kuwait|bahrain|qatar|addis ababa/.test(p)) return 3;
    if (/dubai|abu dhabi|muscat|uae/.test(p)) return 4;
    if (/karachi|lahore|islamabad/.test(p)) return 5;
    if (/dhaka|bangladesh/.test(p)) return 6;
    if (/yangon|myanmar/.test(p)) return 6.5;
    if (/bangkok|hanoi|jakarta|vietnam|thailand/.test(p)) return 7;
    if (/singapore|kuala lumpur|malaysia|beijing|shanghai|hong kong|taipei/.test(p)) return 8;
    if (/tokyo|osaka|seoul/.test(p)) return 9;
    if (/sydney|melbourne|brisbane|australia/.test(p)) return 10;
    if (/auckland|new zealand/.test(p)) return 12;
    if (/new york|toronto|miami|boston|washington|chicago|houston|dallas|montreal/.test(p)) return -5;
    if (/denver|phoenix|colorado|utah|mountain time/.test(p)) return -7;
    if (/los angeles|san francisco|seattle|vancouver|portland|california/.test(p)) return -8;
    return 5.5; // IST — default for India and unrecognised places
}

// ─── Nakshatra names (0 = Ashwini at 0° sidereal Aries) ──────────────────────
const NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Calculate Janma Nakshatra from birth details using Moon's astronomical position.
 * Returns the Nakshatra name, or '' if input is invalid.
 */
export function calculateNakshatra(
    dateStr:  string,   // "YYYY-MM-DD"
    timeStr:  string,   // "HH:MM" or "HH:MM:SS"  (local time)
    place:    string,   // city/country for timezone
): string {
    try {
        const parts = (dateStr || '').split('-').map(Number);
        if (parts.length < 3 || !parts[0]) return '';
        const [year, month, day] = parts;

        const timeParts = (timeStr || '12:00').split(':').map(Number);
        const localHour   = timeParts[0] || 0;
        const localMinute = timeParts[1] || 0;

        // Convert local birth time to UTC
        const offset = utcOffsetHours(place);
        let utcH = localHour   - Math.floor(offset);
        let utcM = localMinute - Math.round((offset % 1) * 60);
        if (utcM < 0)  { utcM += 60; utcH -= 1; }
        if (utcM >= 60){ utcM -= 60; utcH += 1; }
        // utcH may be negative or ≥ 24; julianDay handles fractional days correctly.

        const jd       = julianDay(year, month, day, utcH, utcM);
        const tropical = moonTropicalLongitude(jd);
        const ayanamsa = lahiriAyanamsa(jd);
        const sidereal = norm360(tropical - ayanamsa);

        // Each Nakshatra = 360/27 = 13.333...°
        const idx = Math.floor(sidereal / (360 / 27));
        return NAKSHATRA_NAMES[idx % 27] ?? '';
    } catch {
        return '';
    }
}
