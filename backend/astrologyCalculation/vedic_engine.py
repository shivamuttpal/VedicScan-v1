"""
vedic_engine.py
================
Production-grade Vedic (Jyotish) calculation core built on the Swiss Ephemeris.

This is the engine that does the real astronomy. It is deliberately strict about
the things that matter for Vedic accuracy:

  * Sidereal zodiac with Lahiri (Chitrapaksha) ayanamsa  -> matches Indian standard
  * The ASCENDANT (Lagna) is converted to sidereal too. swe.houses() returns a
    TROPICAL ascendant; we subtract the ayanamsa. (Forgetting this is the classic
    bug that throws the Lagna off by ~24 degrees / almost a full sign.)
  * Rahu = Mean Node (the Lahiri / North-Indian convention). Ketu = Rahu + 180.
  * Whole-sign houses (Bhava) — the dominant Parashari house system.
  * Nakshatra + Pada, planetary dignity, retrogression, and Navamsa (D9).

For maximum precision you can drop the Swiss Ephemeris data files (sepl_*.se1,
semo_*.se1) somewhere and call VedicEngine(ephe_path="/path/to/ephe"). Without
them the library transparently falls back to the built-in Moshier ephemeris,
which is still accurate to well under an arc-minute for modern dates — far finer
than any nakshatra (13deg20') or pada (3deg20') boundary.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta

import swisseph as swe


# --------------------------------------------------------------------------- #
#  Static Jyotish reference data
# --------------------------------------------------------------------------- #
RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

RASHIS_SANSKRIT = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

# Sign lords (rashi index 0-11 -> ruling planet)
SIGN_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
]

# Vimshottari dasha sequence + period in years (total = 120)
DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}

# Length of a Vimshottari "year" in days. 365.25 matches most modern software
# (Jagannatha Hora style). Some traditions use 360 (savana) or 365.2563 (sidereal).
# Exposed so you can match whatever reference engine you benchmark against.
VIMSOTTARI_YEAR_DAYS = 365.25

# D9 (Navamsa) starting sign per zodiac element:
#   Fire  (Ar,Le,Sg) -> Aries(0)     Earth (Ta,Vi,Cp) -> Capricorn(9)
#   Air   (Ge,Li,Aq) -> Libra(6)     Water (Cn,Sc,Pi) -> Cancer(3)
NAVAMSA_STARTS = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]

# Exaltation / debilitation (sign index, exact degree of deep exaltation)
EXALTATION = {
    "Sun": (0, 10), "Moon": (1, 3), "Mars": (9, 28), "Mercury": (5, 15),
    "Jupiter": (3, 5), "Venus": (11, 27), "Saturn": (6, 20),
}
DEBILITATION = {p: ((s + 6) % 12, d) for p, (s, d) in EXALTATION.items()}

# Own signs
OWN_SIGNS = {
    "Sun": [4], "Moon": [3], "Mars": [0, 7], "Mercury": [2, 5],
    "Jupiter": [8, 11], "Venus": [1, 6], "Saturn": [9, 10],
}

# Moolatrikona (sign index, start degree, end degree)
MOOLATRIKONA = {
    "Sun": (4, 0, 20), "Moon": (1, 3, 30), "Mars": (0, 0, 12), "Mercury": (5, 16, 20),
    "Jupiter": (8, 0, 10), "Venus": (6, 0, 15), "Saturn": (10, 0, 20),
}

# Natural (naisargika) friendships
NATURAL_FRIENDS = {
    "Sun":     {"friends": {"Moon", "Mars", "Jupiter"}, "enemies": {"Venus", "Saturn"}},
    "Moon":    {"friends": {"Sun", "Mercury"}, "enemies": set()},
    "Mars":    {"friends": {"Sun", "Moon", "Jupiter"}, "enemies": {"Mercury"}},
    "Mercury": {"friends": {"Sun", "Venus"}, "enemies": {"Moon"}},
    "Jupiter": {"friends": {"Sun", "Moon", "Mars"}, "enemies": {"Mercury", "Venus"}},
    "Venus":   {"friends": {"Mercury", "Saturn"}, "enemies": {"Sun", "Moon"}},
    "Saturn":  {"friends": {"Mercury", "Venus"}, "enemies": {"Sun", "Moon", "Mars"}},
}

NAK_LEN = 360.0 / 27.0        # 13deg 20'
PADA_LEN = NAK_LEN / 4.0      # 3deg 20'


class VedicEngine:
    """Sidereal (Lahiri) Vedic chart engine. One instance is reusable."""

    def __init__(self, ayanamsa: int = swe.SIDM_LAHIRI,
                 node: str = "true", ephe_path: str | None = None):
        if ephe_path:
            swe.set_ephe_path(ephe_path)
        swe.set_sid_mode(ayanamsa)
        # True Node matches Jagannatha Hora, AstroSage, Parashara Light default.
        # Mean Node gives slightly smoother dasha calculations but can differ by ~1°.
        self.node_const = swe.TRUE_NODE if node == "true" else swe.MEAN_NODE
        self.node_type  = "True Node" if node == "true" else "Mean Node"
        self.node_is_retro = True  # both true and mean node always move retrograde

    # ------------------------------------------------------------------ #
    #  Low-level helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _norm(deg: float) -> float:
        return deg % 360.0

    @staticmethod
    def to_julian_day(dob: str, tob: str, tz_offset: float) -> float:
        """Local civil time -> Julian Day (UT).

        Uses timedelta subtraction so midnight crossings (e.g., 00:30 IST)
        correctly roll back to the previous calendar date in UTC, rather than
        passing a negative hour to swe.julday() which, while technically
        handled by SwissEph, is fragile across month/year boundaries.
        """
        local_dt = datetime.strptime(f"{dob} {tob}", "%Y-%m-%d %H:%M")
        # Subtract timezone offset to get UTC datetime (handles date rollover)
        utc_dt = local_dt - timedelta(hours=tz_offset)
        ut_hour = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
        return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, ut_hour)

    def _nakshatra(self, lon: float) -> dict:
        idx = int(lon / NAK_LEN) % 27
        pada = int((lon % NAK_LEN) / PADA_LEN) + 1
        return {
            "nakshatra": NAKSHATRAS[idx],
            "nakshatra_id": idx + 1,
            "nakshatra_lord": DASHA_SEQUENCE[idx % 9],
            "pada": pada,
        }

    def _dignity(self, planet: str, lon: float) -> str:
        """Classify the planet's strength in the sign it occupies."""
        if planet in ("Rahu", "Ketu"):
            return "—"  # nodal exaltation is disputed; we don't assert it
        sign = int(lon // 30)
        deg = lon % 30

        ex_sign, _ = EXALTATION[planet]
        deb_sign, _ = DEBILITATION[planet]
        if sign == ex_sign:
            return "Exalted"
        if sign == deb_sign:
            return "Debilitated"

        mt_sign, mt_lo, mt_hi = MOOLATRIKONA[planet]
        if sign == mt_sign and mt_lo <= deg < mt_hi:
            return "Moolatrikona"
        if sign in OWN_SIGNS[planet]:
            return "Own Sign"

        lord = SIGN_LORDS[sign]
        if lord == planet:
            return "Own Sign"
        rel = NATURAL_FRIENDS[planet]
        if lord in rel["friends"]:
            return "Friendly Sign"
        if lord in rel["enemies"]:
            return "Enemy Sign"
        return "Neutral Sign"

    def _format_body(self, name: str, lon: float, speed: float | None) -> dict:
        sign = int(lon // 30)
        retro = self.node_is_retro if name in ("Rahu", "Ketu") \
            else (speed is not None and speed < 0)
        data = {
            "name": name,
            "absolute_degree": round(lon, 4),
            "rashi": RASHIS[sign],
            "rashi_sanskrit": RASHIS_SANSKRIT[sign],
            "rashi_id": sign + 1,
            "rashi_lord": SIGN_LORDS[sign],
            "degree_in_rashi": round(lon % 30, 4),
            "dms": self._to_dms(lon % 30),
            "retrograde": bool(retro),
            "dignity": self._dignity(name, lon),
        }
        data.update(self._nakshatra(lon))
        return data

    @staticmethod
    def _to_dms(deg: float) -> str:
        d = int(deg)
        m_full = (deg - d) * 60
        m = int(m_full)
        s = int((m_full - m) * 60)
        return f"{d}\u00b0{m:02d}'{s:02d}\""

    # ------------------------------------------------------------------ #
    #  Planets + Lagna
    # ------------------------------------------------------------------ #
    def _planet_positions(self, jd: float) -> dict:
        flags = swe.FLG_SIDEREAL | swe.FLG_SWIEPH | swe.FLG_SPEED
        bodies = {
            "Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS,
            "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER,
            "Venus": swe.VENUS, "Saturn": swe.SATURN,
        }
        out = {}
        for name, bid in bodies.items():
            xx, _ = swe.calc_ut(jd, bid, flags)
            out[name] = self._format_body(name, self._norm(xx[0]), xx[3])

        # Rahu (node) then Ketu opposite
        nx, _ = swe.calc_ut(jd, self.node_const, flags)
        rahu_lon = self._norm(nx[0])
        out["Rahu"] = self._format_body("Rahu", rahu_lon, nx[3])
        out["Ketu"] = self._format_body("Ketu", self._norm(rahu_lon + 180.0), nx[3])
        return out

    def _lagna(self, jd: float, lat: float, lon: float) -> dict:
        """
        Sidereal Ascendant using the proper sidereal house API.

        swe.houses_ex() with FLG_SIDEREAL applies the Lahiri ayanamsa
        internally and returns sidereal cusps directly — no manual subtraction
        required. House system 'W' = Whole Sign (standard Parashari).

        Fallback: if houses_ex is unavailable in the installed pyswisseph build,
        we fall back to manually subtracting the ayanamsa from the tropical ASC.
        Both methods are mathematically equivalent; houses_ex is the canonical one.
        """
        ayan = swe.get_ayanamsa_ut(jd)
        try:
            _, ascmc = swe.houses_ex(jd, lat, lon, b"W", swe.FLG_SIDEREAL)
            sid_asc = self._norm(ascmc[0])
        except Exception:
            # Fallback for older pyswisseph builds
            _, ascmc = swe.houses(jd, lat, lon, b"W")
            sid_asc = self._norm(ascmc[0] - ayan)

        sign = int(sid_asc // 30)
        result = {
            "absolute_degree": round(sid_asc, 4),
            "sign": RASHIS[sign],
            "sign_sanskrit": RASHIS_SANSKRIT[sign],
            "rashi_id": sign + 1,
            "sign_lord": SIGN_LORDS[sign],
            "degree": round(sid_asc % 30, 4),
            "dms": self._to_dms(sid_asc % 30),
            "ayanamsa": round(ayan, 4),
        }
        result.update(self._nakshatra(sid_asc))
        return result

    # ------------------------------------------------------------------ #
    #  Houses (Whole Sign) + Navamsa (D9)
    # ------------------------------------------------------------------ #
    @staticmethod
    def _house_of(planet_sign_idx: int, lagna_sign_idx: int) -> int:
        return ((planet_sign_idx - lagna_sign_idx) % 12) + 1

    @staticmethod
    def _navamsa_sign(lon: float) -> int:
        sign = int(lon // 30)
        deg_in_sign = lon % 30
        nav_num = int(deg_in_sign / (30.0 / 9.0))
        return (NAVAMSA_STARTS[sign] + nav_num) % 12

    # ------------------------------------------------------------------ #
    #  Vimshottari Dasha (Maha -> Antar -> Pratyantar)
    # ------------------------------------------------------------------ #
    def _dasha_timeline(self, moon_lon: float, dob: str, tob: str,
                        tz_offset: float) -> dict:
        birth_dt = datetime.strptime(f"{dob} {tob}", "%Y-%m-%d %H:%M")
        now = datetime.now()

        nak_idx = int(moon_lon / NAK_LEN)
        nak_pos = moon_lon % NAK_LEN
        start_lord = DASHA_SEQUENCE[nak_idx % 9]

        # The first mahadasha actually STARTED before birth. This is the part
        # the old code got wrong (it anchored to birth_dt, corrupting the very
        # first antardasha). We back-date to the true start so every sub-period
        # lines up correctly.
        elapsed_fraction = nak_pos / NAK_LEN
        elapsed_days = DASHA_YEARS[start_lord] * elapsed_fraction * VIMSOTTARI_YEAR_DAYS
        md_start = birth_dt - timedelta(days=elapsed_days)

        # Build mahadashas forward until we've covered a full 120-year lifespan
        horizon = birth_dt + timedelta(days=120 * VIMSOTTARI_YEAR_DAYS)
        seq_start = DASHA_SEQUENCE.index(start_lord)

        timeline = []
        cursor = md_start
        i = 0
        while cursor < horizon:
            lord = DASHA_SEQUENCE[(seq_start + i) % 9]
            end = cursor + timedelta(days=DASHA_YEARS[lord] * VIMSOTTARI_YEAR_DAYS)
            timeline.append(self._build_mahadasha(lord, cursor, end, now))
            cursor = end
            i += 1

        current_md = next((m for m in timeline if m["isCurrent"]), None)
        current_ad = current_pt = None
        if current_md:
            current_ad = next((a for a in current_md["antardashas"] if a["isCurrent"]), None)
            if current_ad:
                current_pt = next((p for p in current_ad["pratyantars"] if p["isCurrent"]), None)

        return {
            "birth_lord": start_lord,
            "current_mahadasha": current_md["planet"] if current_md else None,
            "mahadasha_start_date": current_md["startDate"] if current_md else None,
            "mahadasha_end_date": current_md["endDate"] if current_md else None,
            "current_antardasha": current_ad["planet"] if current_ad else None,
            "antardasha_start_date": current_ad["startDate"] if current_ad else None,
            "antardasha_end_date": current_ad["endDate"] if current_ad else None,
            "current_pratyantar": current_pt["planet"] if current_pt else None,
            "pratyantar_start_date": current_pt["startDate"] if current_pt else None,
            "pratyantar_end_date": current_pt["endDate"] if current_pt else None,
            "timeline": timeline,
        }

    def _build_mahadasha(self, lord: str, start: datetime, end: datetime,
                         now: datetime) -> dict:
        is_current = start <= now < end
        antardashas = []
        ad_cursor = start
        lord_idx = DASHA_SEQUENCE.index(lord)
        for i in range(9):
            ad_lord = DASHA_SEQUENCE[(lord_idx + i) % 9]
            ad_years = DASHA_YEARS[lord] * DASHA_YEARS[ad_lord] / 120.0
            ad_end = ad_cursor + timedelta(days=ad_years * VIMSOTTARI_YEAR_DAYS)
            ad_current = ad_cursor <= now < ad_end
            # Pratyantar only expanded for the running antardasha (keeps JSON lean)
            pts = self._build_pratyantars(lord, ad_lord, ad_cursor, ad_end, now) \
                if ad_current else []
            antardashas.append({
                "planet": ad_lord,
                "startDate": ad_cursor.strftime("%Y-%m-%d"),
                "endDate": ad_end.strftime("%Y-%m-%d"),
                "isCurrent": ad_current,
                "pratyantars": pts,
            })
            ad_cursor = ad_end
        return {
            "planet": lord,
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate": end.strftime("%Y-%m-%d"),
            "isCurrent": is_current,
            "antardashas": antardashas,
        }

    def _build_pratyantars(self, md: str, ad: str, start: datetime,
                           ad_end: datetime, now: datetime) -> list:
        out = []
        cursor = start
        ad_idx = DASHA_SEQUENCE.index(ad)
        for j in range(9):
            pt_lord = DASHA_SEQUENCE[(ad_idx + j) % 9]
            pt_years = (DASHA_YEARS[md] * DASHA_YEARS[ad] * DASHA_YEARS[pt_lord]) / (120.0 * 120.0)
            pt_end = cursor + timedelta(days=pt_years * VIMSOTTARI_YEAR_DAYS)
            out.append({
                "planet": pt_lord,
                "startDate": cursor.strftime("%Y-%m-%d"),
                "endDate": pt_end.strftime("%Y-%m-%d"),
                "isCurrent": cursor <= now < pt_end,
            })
            cursor = pt_end
        return out

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #
    def calculate_full_chart(self, dob: str, tob: str, lat: float,
                             lon: float, tz_offset: float = 5.5) -> dict:
        """
        Full sidereal kundali.

        dob       : "YYYY-MM-DD"
        tob       : "HH:MM"  (local clock time at birthplace)
        lat, lon  : decimal degrees (N+, E+)
        tz_offset : hours east of UTC (India = 5.5)
        """
        jd = self.to_julian_day(dob, tob, tz_offset)
        now = datetime.now()

        lagna = self._lagna(jd, lat, lon)
        lagna_sign = lagna["rashi_id"] - 1

        planets = self._planet_positions(jd)

        # Houses (whole sign) + navamsa for each planet
        lagna_nav = self._navamsa_sign(lagna["absolute_degree"])
        for name, p in planets.items():
            p_sign = p["rashi_id"] - 1
            p["houseNumber"] = self._house_of(p_sign, lagna_sign)
            nav = self._navamsa_sign(p["absolute_degree"])
            p["navamsaSign"] = RASHIS[nav]
            p["navamsaHouse"] = self._house_of(nav, lagna_nav)

        houses = []
        for h in range(1, 13):
            sign_idx = (lagna_sign + h - 1) % 12
            houses.append({
                "number": h,
                "sign": RASHIS[sign_idx],
                "sign_sanskrit": RASHIS_SANSKRIT[sign_idx],
                "sign_lord": SIGN_LORDS[sign_idx],
                "planets": [n for n, p in planets.items() if p["houseNumber"] == h],
            })

        navamsa = {
            "lagnaSign": RASHIS[lagna_nav],
            "planets": {n: {"sign": p["navamsaSign"], "houseNumber": p["navamsaHouse"]}
                        for n, p in planets.items()},
        }

        dasha = self._dasha_timeline(planets["Moon"]["absolute_degree"], dob, tob, tz_offset)

        return {
            "status": "success",
            "meta": {
                "current_date": now.strftime("%Y-%m-%d"),
                "current_time": now.strftime("%H:%M"),
                "current_weekday": now.strftime("%A"),
                "ayanamsa": lagna["ayanamsa"],
                "ayanamsa_system": "Lahiri (Chitrapaksha)",
                "house_system": "Whole Sign (Bhava)",
                "node_type": self.node_type,
                "julian_day_ut": round(jd, 6),
                "note": "Sidereal positions. Use current_date as the reference for timing queries.",
            },
            "birth_details": {"dob": dob, "tob": tob, "lat": lat, "lon": lon, "tz_offset": tz_offset},
            "chart_data": {
                "Lagna": {**lagna, "houseNumber": 1, "navamsaSign": RASHIS[lagna_nav]},
                "Planets": planets,
                "Houses": houses,
            },
            "navamsa_data": navamsa,
            "dasha_data": dasha,
        }


# Backwards-compatible alias so existing imports keep working:
#   from vedic_engine import VedicV2Engine
VedicV2Engine = VedicEngine


if __name__ == "__main__":
    eng = VedicEngine()
    chart = eng.calculate_full_chart("1990-08-15", "14:30", 12.97, 77.59, 5.5)
    import json
    print(json.dumps(chart, indent=2)[:1500])