"""
sadesati_engine.py
==================
Sade Sati (Shani Sade Sati) + Dhaiya engine, built on top of vedic_engine.py.

WHAT SADE SATI IS
-----------------
The ~7.5-year period while transiting Saturn (Shani) passes through the three
signs centred on the natal Moon sign (Janma Rashi):
    * 12th from Moon  -> "Rising"  phase (Arambha / Aroha)   ~2.5 yrs
    * Moon sign        -> "Peak"    phase (Madhya / Janma)     ~2.5 yrs
    * 2nd from Moon    -> "Setting" phase (Anta / Avaroha)     ~2.5 yrs
It is measured from the MOON sign, never the Lagna. A full cycle recurs about
every 30 years (Saturn's sidereal period ~29.5 yrs).

DHAIYA (the "small panoti", 2.5 yrs each)
    * Kantaka / Ardha-Ashtama Shani -> Saturn in 4th from Moon
    * Ashtama Shani                 -> Saturn in 8th from Moon

WHY THIS ENGINE IS ACCURATE
---------------------------
Saturn is retrograde ~4.5 months a year, so near a sign boundary it can enter,
retrograde back out, and re-enter. Engines that just stack fixed 2.5-year
blocks get the start/end dates wrong. This engine computes Saturn's REAL
sidereal longitude over time and finds every boundary crossing (including
retrograde re-entries) by bisection, then groups the runs into cycles.
"""

from __future__ import annotations
import swisseph as swe
from datetime import datetime, timezone

# Importing vedic_engine sets Lahiri ayanamsa and resolves the ephemeris flag.
from vedic_engine import RASHIS, RASHIS_SANSKRIT, SIGN_LORDS, _EPHE_FLAG, jd_to_date

DAYS_PER_YEAR = 365.25
# A real gap between two Sade Sati cycles (or two Dhaiya occurrences) is ~22-30
# years. A retrograde dip just outside the band lasts only a few months. Any gap
# shorter than this threshold is a retrograde wobble and is merged into one period.
MERGE_GAP_DAYS = 500.0

# Traditional significations (kept concise and neutral; this is interpretive
# content, not a prediction about any individual).
PHASE_SIGNIFICATIONS = {
    "Rising": "12th from Moon. Traditionally linked to expenses, travel, "
              "disturbed sleep, detachment and endings; a time to consolidate.",
    "Peak": "Saturn over the Moon (Janma Shani). The most intense phase: "
            "mental pressure, health and close relationships are emphasised.",
    "Setting": "2nd from Moon. Associated with finances, family, speech and "
               "food; the pressure gradually eases and stabilises.",
}
PHASE_SANSKRIT = {"Rising": "Aroha (Arambha)", "Peak": "Madhya (Janma Shani)", "Setting": "Avaroha (Anta)"}


# --------------------------------------------------------------------------
# Low-level Saturn position helpers
# --------------------------------------------------------------------------
def _saturn_lon(jd_ut: float) -> tuple[float, float]:
    """Sidereal longitude and longitude-speed of Saturn at jd (UT)."""
    flags = swe.FLG_SIDEREAL | _EPHE_FLAG | swe.FLG_SPEED
    res = swe.calc_ut(jd_ut, swe.SATURN, flags)
    return res[0][0] % 360.0, res[0][3]


def _saturn_sign(jd_ut: float) -> int:
    return int(_saturn_lon(jd_ut)[0] // 30) % 12


def _find_boundary(lo: float, hi: float) -> float:
    """Bisect the JD in (lo, hi) where Saturn's SIGN changes. Assumes exactly
    one sign change in the interval (guaranteed by the small scan step)."""
    s_lo = _saturn_sign(lo)
    for _ in range(40):                 # 40 halvings of a 2-day step -> sub-second
        mid = 0.5 * (lo + hi)
        if _saturn_sign(mid) == s_lo:
            lo = mid
        else:
            hi = mid
    return hi


def _saturn_runs(jd_start: float, jd_end: float, step: float = 2.0):
    """Return contiguous [sign, start_jd, end_jd] runs of Saturn's sign.
    Retrograde re-entries appear naturally as separate runs of the same sign."""
    runs = []
    jd = jd_start
    cur_sign = _saturn_sign(jd)
    run_start = jd_start
    while jd < jd_end:
        nxt = min(jd + step, jd_end)
        s = _saturn_sign(nxt)
        if s != cur_sign:
            cross = _find_boundary(jd, nxt)
            runs.append([cur_sign, run_start, cross])
            cur_sign = s
            run_start = cross
        jd = nxt
    runs.append([cur_sign, run_start, jd_end])
    return runs


def _now_jd() -> float:
    n = datetime.now(timezone.utc)
    return swe.julday(n.year, n.month, n.day, n.hour + n.minute / 60.0 + n.second / 3600.0)


# --------------------------------------------------------------------------
# Engine
# --------------------------------------------------------------------------
class SadeSatiEngine:
    def __init__(self, scan_back_years: float = 8.0, scan_forward_years: float = 100.0):
        self.scan_back = scan_back_years
        self.scan_forward = scan_forward_years

    # ---- public API --------------------------------------------------------
    def analyse(self, moon_sign_id: int, jd_birth: float, jd_now: float | None = None) -> dict:
        """moon_sign_id: 1-12 (rashi_id of the natal Moon)."""
        if jd_now is None:
            jd_now = _now_jd()

        m = (moon_sign_id - 1) % 12
        twelfth, second = (m - 1) % 12, (m + 1) % 12          # Sade Sati signs
        fourth, eighth = (m + 3) % 12, (m + 7) % 12           # Dhaiya signs
        sade_set = {twelfth, m, second}

        scan_start = jd_birth - self.scan_back * DAYS_PER_YEAR
        scan_end = max(jd_birth + self.scan_forward * DAYS_PER_YEAR,
                       jd_now + 35 * DAYS_PER_YEAR)
        runs = _saturn_runs(scan_start, scan_end)

        cycles = self._build_cycles(runs, m, twelfth, second, sade_set, jd_now)
        dhaiya = self._build_dhaiya(runs, fourth, eighth, jd_now)

        sat_lon, sat_speed = _saturn_lon(jd_now)
        saturn_now = {
            "sign": RASHIS[int(sat_lon // 30)],
            "degree_in_sign": round(sat_lon % 30, 4),
            "retrograde": sat_speed < 0,
            "as_of": jd_to_date(jd_now),
        }

        current = next((c for c in cycles if c["is_current"]), None)
        upcoming = next((c for c in cycles if c["start_jd"] > jd_now), None)

        current_status = self._current_status(current, upcoming, dhaiya, jd_now)

        # Strip internal jd keys before returning.
        for c in cycles:
            c.pop("start_jd", None)
        return {
            "status": "success",
            "moon_sign": RASHIS[m],
            "moon_sign_sanskrit": RASHIS_SANSKRIT[m],
            "moon_sign_id": m + 1,
            "sade_sati_signs": {
                "twelfth_from_moon": RASHIS[twelfth],
                "moon_sign": RASHIS[m],
                "second_from_moon": RASHIS[second],
            },
            "dhaiya_signs": {
                "kantaka_shani_4th": RASHIS[fourth],
                "ashtama_shani_8th": RASHIS[eighth],
            },
            "saturn_now": saturn_now,
            "current_status": current_status,
            "cycles": cycles,
            "dhaiya": dhaiya,
        }

    # ---- internals ---------------------------------------------------------
    def _build_cycles(self, runs, m, twelfth, second, sade_set, jd_now):
        # Step 1: collect contiguous runs that fall in the three Sade Sati signs,
        # keeping each group as a list of (sign, start_jd, end_jd).
        raw, cur = [], None
        for sign, s, e in runs:
            if sign in sade_set:
                if cur is None:
                    cur = []
                cur.append((sign, s, e))
            elif cur is not None:
                raw.append(cur); cur = None
        if cur is not None:
            raw.append(cur)

        # Step 2: merge groups separated only by a short retrograde dip out of
        # the band (gap < MERGE_GAP_DAYS) into a single real cycle.
        groups = []
        for g in raw:
            if groups and (g[0][1] - groups[-1][-1][2]) < MERGE_GAP_DAYS:
                groups[-1].extend(g)
            else:
                groups.append(list(g))

        # Step 3: build each cycle with its three phases.
        cycles = []
        for i, g in enumerate(groups, start=1):
            start_jd, end_jd = g[0][1], g[-1][2]
            phases = []
            for label, sign_idx in (("Rising", twelfth), ("Peak", m), ("Setting", second)):
                segs = [(s, e) for sg, s, e in g if sg == sign_idx]
                if not segs:
                    continue
                phases.append({
                    "phase": label,
                    "phase_sanskrit": PHASE_SANSKRIT[label],
                    "sign": RASHIS[sign_idx],
                    "startDate": jd_to_date(min(s for s, _ in segs)),
                    "endDate": jd_to_date(max(e for _, e in segs)),
                    "retrograde_passes": len(segs),     # >1 -> Saturn wobbled across the cusp
                    "significance": PHASE_SIGNIFICATIONS[label],
                })
            cycles.append({
                "cycle_number": i,
                "startDate": jd_to_date(start_jd),
                "endDate": jd_to_date(end_jd),
                "approx_years": round((end_jd - start_jd) / DAYS_PER_YEAR, 2),
                "is_current": start_jd <= jd_now < end_jd,
                "is_past": end_jd <= jd_now,
                "phases": phases,
                "start_jd": start_jd,           # internal, stripped before return
            })
        return cycles

    def _build_dhaiya(self, runs, fourth, eighth, jd_now):
        def collect(target):
            out = []
            for sign, s, e in runs:
                if sign == target:
                    # Merge with previous interval if the gap is just a retrograde dip.
                    if out and (s - out[-1]["_end_jd"]) < MERGE_GAP_DAYS:
                        out[-1]["endDate"] = jd_to_date(e)
                        out[-1]["_end_jd"] = e
                        out[-1]["is_current"] = out[-1]["_start_jd"] <= jd_now < e
                    else:
                        out.append({"startDate": jd_to_date(s), "endDate": jd_to_date(e),
                                    "is_current": s <= jd_now < e, "_end_jd": e, "_start_jd": s})
            return out

        kantaka = collect(fourth)
        ashtama = collect(eighth)
        cur = None
        for typ, lst in (("Kantaka Shani (4th)", kantaka), ("Ashtama Shani (8th)", ashtama)):
            for d in lst:
                if d["is_current"]:
                    cur = {"type": typ, "startDate": d["startDate"], "endDate": d["endDate"]}
        for lst in (kantaka, ashtama):
            for d in lst:
                d.pop("_end_jd", None); d.pop("_start_jd", None)
        return {"kantaka_shani_4th": kantaka, "ashtama_shani_8th": ashtama, "current": cur}

    def _current_status(self, current, upcoming, dhaiya, jd_now):
        if current:
            # Ground truth: the active phase is whichever band-sign Saturn is in
            # right now (phases can overlap in date due to retrograde).
            sat_sign = RASHIS[_saturn_sign(jd_now)]
            active = next((p for p in current["phases"] if p["sign"] == sat_sign), None)
            if active is None:   # boundary fallback
                active = next((p for p in current["phases"]
                               if p["startDate"] <= jd_to_date(jd_now) <= p["endDate"]), None)
            return {
                "in_sade_sati": True,
                "phase": active["phase"] if active else None,
                "phase_sanskrit": active["phase_sanskrit"] if active else None,
                "phase_end_date": active["endDate"] if active else None,
                "cycle_start_date": current["startDate"],
                "cycle_end_date": current["endDate"],
                "significance": active["significance"] if active else None,
                "in_dhaiya": dhaiya["current"],
            }
        return {
            "in_sade_sati": False,
            "next_cycle_start_date": upcoming["startDate"] if upcoming else None,
            "next_cycle_end_date": upcoming["endDate"] if upcoming else None,
            "in_dhaiya": dhaiya["current"],
        }


# --------------------------------------------------------------------------
# Standalone bridge: mirrors kundali_bridge (stdin JSON -> stdout JSON).
# Input may be either a Moon sign directly, or full birth details:
#   {"moon_sign_id": 2, "dob":"1990-08-15"}                         (Moon sign known)
#   {"dob":"1990-08-15","tob":"14:30","lat":28.61,"lon":77.20,"tz_offset":5.5}
# --------------------------------------------------------------------------
def main():
    import sys, json
    try:
        data = json.loads(sys.stdin.read())
        from vedic_engine import VedicEngine
        eng = VedicEngine()

        if "moon_sign_id" in data and "dob" in data:
            jd_birth = eng.to_julian_ut(data["dob"], data.get("tob", "12:00"),
                                        float(data.get("tz_offset", 5.5)))
            moon_sign_id = int(data["moon_sign_id"])
        else:
            chart = eng.calculate_full_chart(
                dob=data["dob"], tob=data["tob"],
                lat=float(data["lat"]), lon=float(data["lon"]),
                tz_offset=float(data.get("tz_offset", 5.5)),
            )
            jd_birth = chart["meta"]["julian_day_ut"]
            moon_sign_id = chart["chart_data"]["Planets"]["Moon"]["rashi_id"]

        sade = SadeSatiEngine().analyse(moon_sign_id, jd_birth)
        print(json.dumps(sade, default=str))
    except Exception as e:
        import traceback, sys, json
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()