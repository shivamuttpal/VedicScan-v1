"""
transit_calculator.py — Upcoming Jupiter transits and waxing moon windows.

Pure computation module — no stdin/stdout. Called from transit_bridge.py.
Uses Swiss Ephemeris (sidereal, Lahiri ayanamsa) to compute:
  * Jupiter's current transit sign + house from natal lagna
  * Next N sign-change dates for Jupiter (with natal house numbers)
  * Upcoming waxing moon windows (new moon → full moon) for favorable timing
"""

from __future__ import annotations

import datetime
import swisseph as swe

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Same flags as vedic_engine.py for consistency
_FLAGS = swe.FLG_SIDEREAL | swe.FLG_SWIEPH | swe.FLG_SPEED


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_jd() -> float:
    n = datetime.datetime.utcnow()
    return swe.julday(n.year, n.month, n.day,
                      n.hour + n.minute / 60.0 + n.second / 3600.0)


def _sid_lon(jd: float, planet: int) -> float:
    """Sidereal ecliptic longitude for a planet (0–360°)."""
    try:
        xx, _ = swe.calc_ut(jd, planet, _FLAGS)
    except Exception:
        # Fallback without FLG_SWIEPH (older builds / no data files)
        xx, _ = swe.calc_ut(jd, planet, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    return xx[0] % 360.0


def _sign_idx(jd: float, planet: int) -> int:
    return int(_sid_lon(jd, planet) / 30.0) % 12


def _jd_to_str(jd: float) -> str:
    y, m, d, _ = swe.revjul(jd, swe.GREG_CAL)
    try:
        return datetime.date(int(y), int(m), int(d)).strftime("%b %d, %Y")
    except Exception:
        return f"{int(y)}-{int(m):02d}-{int(d):02d}"


# ── Jupiter transit finder ────────────────────────────────────────────────────

def _find_sign_entry(planet: int, target: int, start_jd: float,
                     max_days: int = 550) -> float | None:
    """Return JD when planet first enters `target` sign after start_jd."""
    step = 10.0
    jd   = start_jd
    prev = _sign_idx(jd, planet)

    for _ in range(int(max_days / step) + 2):
        jd  += step
        curr = _sign_idx(jd, planet)
        if curr == target and prev != target:
            # Binary search for exact crossing
            lo, hi = jd - step, jd
            for _ in range(40):
                mid = (lo + hi) / 2.0
                if _sign_idx(mid, planet) == target:
                    hi = mid
                else:
                    lo = mid
            return hi
        prev = curr
    return None


# ── Lunar phase finder ────────────────────────────────────────────────────────

def _moon_sun_diff(jd: float) -> float:
    """Moon-Sun sidereal elongation (0–360°)."""
    return (_sid_lon(jd, swe.MOON) - _sid_lon(jd, swe.SUN)) % 360.0


def _find_phase(start_jd: float, target: float, max_days: int = 35) -> float | None:
    """
    Return JD of the next lunar phase crossing after start_jd.
    target=0 → new moon  (elongation wraps 360→0)
    target=180 → full moon (elongation crosses 180)
    """
    step = 0.5
    jd   = start_jd
    prev = _moon_sun_diff(jd)

    for _ in range(int(max_days / step) + 2):
        jd  += step
        curr = _moon_sun_diff(jd)

        if target == 0:
            crossed = prev > 300 and curr < 60
        else:
            crossed = prev < target <= curr

        if crossed:
            lo, hi = jd - step, jd
            for _ in range(40):
                mid  = (lo + hi) / 2.0
                diff = _moon_sun_diff(mid)
                if target == 0:
                    lo, hi = (mid, hi) if diff > 180 else (lo, mid)
                else:
                    lo, hi = (lo, mid) if diff < target else (mid, hi)
            return hi
        prev = curr
    return None


# ── Public API ────────────────────────────────────────────────────────────────

def compute_transits(lagna_sign_idx: int,
                     num_jupiter: int = 5,
                     num_moon: int = 4) -> dict:
    """
    Compute upcoming Jupiter transits and waxing moon windows.

    lagna_sign_idx : 0-based natal lagna sign (0=Aries … 11=Pisces)
    num_jupiter    : how many upcoming Jupiter sign entries to return
    num_moon       : how many waxing moon windows to return

    Returns:
      {
        jupiter_now:   { sign, house }
        jupiter_ahead: [{ sign, house, entry_date }, ...]
        waxing_windows:[{ start, end }, ...]
      }
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    now_jd = _now_jd()

    # ── Jupiter current ───────────────────────────────────────────────────────
    jup_s = _sign_idx(now_jd, swe.JUPITER)
    result: dict = {
        "jupiter_now": {
            "sign":  SIGNS[jup_s],
            "house": ((jup_s - lagna_sign_idx) % 12) + 1,
        },
        "jupiter_ahead":   [],
        "waxing_windows":  [],
    }

    # ── Upcoming Jupiter sign entries ─────────────────────────────────────────
    scan = now_jd
    for _ in range(num_jupiter):
        curr_s = _sign_idx(scan, swe.JUPITER)
        next_s = (curr_s + 1) % 12
        entry  = _find_sign_entry(swe.JUPITER, next_s, scan)
        if entry is None:
            break
        result["jupiter_ahead"].append({
            "sign":       SIGNS[next_s],
            "house":      ((next_s - lagna_sign_idx) % 12) + 1,
            "entry_date": _jd_to_str(entry),
        })
        scan = entry + 15       # skip past entry to find the next one

    # ── Waxing moon windows ───────────────────────────────────────────────────
    # Go back 15 days so we capture a window we may already be inside
    scan    = now_jd - 15
    added   = 0
    for _ in range(num_moon + 3):
        nm = _find_phase(scan, 0)
        if nm is None:
            break
        fm = _find_phase(nm + 1, 180)
        if fm is None:
            fm = nm + 14.77     # fallback: ~half synodic month

        if fm > now_jd:         # only include windows still ahead
            result["waxing_windows"].append({
                "start": _jd_to_str(nm),
                "end":   _jd_to_str(fm),
            })
            added += 1

        scan = fm + 1
        if added >= num_moon:
            break

    return result
