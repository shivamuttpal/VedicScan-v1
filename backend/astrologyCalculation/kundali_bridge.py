"""
kundali_bridge.py — Extended Vedic Kundali calculation bridge.
Receives JSON on stdin, returns full kundali JSON on stdout.
Adds house placements, Navamsa (D9), full dasha timeline, pratyantar dasha.
"""
import sys
import json
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from vedic_engine import VedicV2Engine
except Exception as e:
    print(json.dumps({"status": "error", "message": f"Import failed: {e}"}))
    sys.exit(1)

RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# D9 Navamsa: starting rashi index for each lagna rashi element
# Fire(0,4,8)→Aries(0), Earth(1,5,9)→Capricorn(9), Air(2,6,10)→Libra(6), Water(3,7,11)→Cancer(3)
NAVAMSA_STARTS = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]

DASHA_PLANETS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10,
    "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
}


def get_navamsa_sign(absolute_degree):
    rashi_idx = int(absolute_degree // 30)
    degree_in_rashi = absolute_degree % 30
    navamsa_num = int(degree_in_rashi / (30.0 / 9))
    start_idx = NAVAMSA_STARTS[rashi_idx]
    return RASHIS[(start_idx + navamsa_num) % 12]


def get_house_number(planet_rashi_idx, lagna_rashi_idx):
    return ((planet_rashi_idx - lagna_rashi_idx) % 12) + 1


def build_pratyantar_dashas(md_planet, ad_planet, ad_start, current_date):
    pratyantars = []
    pt_cursor = ad_start
    ad_planet_idx = DASHA_PLANETS.index(ad_planet)
    for j in range(9):
        pt_planet = DASHA_PLANETS[(ad_planet_idx + j) % 9]
        pt_years = (DASHA_YEARS[md_planet] * DASHA_YEARS[ad_planet] * DASHA_YEARS[pt_planet]) / (120.0 * 120.0)
        pt_end = pt_cursor + timedelta(days=pt_years * 365.25)
        pratyantars.append({
            "planet": pt_planet,
            "startDate": pt_cursor.strftime("%Y-%m-%d"),
            "endDate": pt_end.strftime("%Y-%m-%d"),
            "isCurrent": pt_cursor <= current_date < pt_end
        })
        pt_cursor = pt_end
    return pratyantars


def build_mahadasha_entry(md_planet, md_start, md_end, current_date):
    is_current_md = md_start <= current_date < md_end
    antardashas = []
    ad_cursor = md_start
    md_planet_idx = DASHA_PLANETS.index(md_planet)

    for i in range(9):
        ad_planet = DASHA_PLANETS[(md_planet_idx + i) % 9]
        ad_years = (DASHA_YEARS[md_planet] * DASHA_YEARS[ad_planet]) / 120.0
        ad_end = ad_cursor + timedelta(days=ad_years * 365.25)
        is_current_ad = ad_cursor <= current_date < ad_end

        pratyantars = build_pratyantar_dashas(md_planet, ad_planet, ad_cursor, current_date) if is_current_ad else []

        antardashas.append({
            "planet": ad_planet,
            "startDate": ad_cursor.strftime("%Y-%m-%d"),
            "endDate": ad_end.strftime("%Y-%m-%d"),
            "isCurrent": is_current_ad,
            "pratyantars": pratyantars
        })
        ad_cursor = ad_end

    return {
        "planet": md_planet,
        "startDate": md_start.strftime("%Y-%m-%d"),
        "endDate": md_end.strftime("%Y-%m-%d"),
        "isCurrent": is_current_md,
        "antardashas": antardashas
    }


def calculate_full_dasha_timeline(moon_lon, birth_date_str):
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
    current_date = datetime.now()

    nak_len = 13 + 1 / 3
    nak_idx = int(moon_lon / nak_len)
    nak_pos = moon_lon % nak_len
    root_ruler_idx = nak_idx % 9
    birth_lord = DASHA_PLANETS[root_ruler_idx]

    fraction_left = 1.0 - (nak_pos / nak_len)
    balance_years = DASHA_YEARS[birth_lord] * fraction_left

    timeline = []
    # First dasha (partial balance at birth)
    end = birth_date + timedelta(days=balance_years * 365.25)
    timeline.append(build_mahadasha_entry(birth_lord, birth_date, end, current_date))

    # Build two full 120-year cycles to cover entire lifespan
    for cycle in range(2):
        for i in range(1 if cycle == 0 else 0, 9):
            md_idx = (root_ruler_idx + i + (9 * cycle if cycle > 0 else 0)) % 9
            # For second cycle, offset by cycle
            if cycle == 1:
                md_idx = (root_ruler_idx + i) % 9
            md_planet = DASHA_PLANETS[md_idx]
            new_start = end
            new_end = new_start + timedelta(days=DASHA_YEARS[md_planet] * 365.25)
            timeline.append(build_mahadasha_entry(md_planet, new_start, new_end, current_date))
            end = new_end

    return timeline


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)

        engine = VedicV2Engine()
        base = engine.calculate_full_chart(
            dob=data["dob"],
            tob=data["tob"],
            lat=float(data["lat"]),
            lon=float(data["lon"]),
            tz_offset=float(data.get("tz_offset", 5.5))
        )

        if base.get("status") != "success":
            print(json.dumps(base))
            return

        chart_data = base["chart_data"]
        lagna = chart_data["Lagna"]
        raw_planets = chart_data["Planets"]

        lagna_rashi_idx = RASHIS.index(lagna["sign"])

        # Extend each planet with house number and navamsa sign
        extended_planets = {}
        for pname, pdata in raw_planets.items():
            rashi = pdata.get("rashi", "Aries")
            rashi_idx = RASHIS.index(rashi) if rashi in RASHIS else 0
            house_num = get_house_number(rashi_idx, lagna_rashi_idx)
            navamsa_sign = get_navamsa_sign(pdata.get("absolute_degree", 0))
            extended_planets[pname] = {
                **pdata,
                "houseNumber": house_num,
                "navamsaSign": navamsa_sign
            }

        # Build 12 houses (whole sign)
        houses = []
        for h in range(1, 13):
            house_sign_idx = (lagna_rashi_idx + h - 1) % 12
            planets_in_house = [p for p, d in extended_planets.items() if d["houseNumber"] == h]
            houses.append({
                "number": h,
                "sign": RASHIS[house_sign_idx],
                "planets": planets_in_house
            })

        # Lagna navamsa
        lagna_navamsa = get_navamsa_sign(lagna.get("absolute_degree", 0))
        lagna_navamsa_idx = RASHIS.index(lagna_navamsa)

        # Navamsa house for each planet
        navamsa_planets = {}
        for pname, pdata in extended_planets.items():
            nav_sign = pdata["navamsaSign"]
            nav_rashi_idx = RASHIS.index(nav_sign) if nav_sign in RASHIS else 0
            nav_house = get_house_number(nav_rashi_idx, lagna_navamsa_idx)
            navamsa_planets[pname] = {
                "sign": nav_sign,
                "houseNumber": nav_house
            }

        # Full dasha timeline
        dasha_timeline = calculate_full_dasha_timeline(
            extended_planets["Moon"]["absolute_degree"],
            data["dob"]
        )

        # Extract current periods
        current_md = next((d for d in dasha_timeline if d["isCurrent"]), None)
        current_ad = None
        current_pt = None
        if current_md:
            current_ad = next((a for a in current_md["antardashas"] if a["isCurrent"]), None)
            if current_ad:
                current_pt = next((p for p in current_ad["pratyantars"] if p["isCurrent"]), None)

        result = {
            "status": "success",
            "meta": base["meta"],
            "birth_details": base["birth_details"],
            "chart_data": {
                "Lagna": {
                    **lagna,
                    "navamsaSign": lagna_navamsa,
                    "houseNumber": 1
                },
                "Planets": extended_planets,
                "Houses": houses
            },
            "navamsa_data": {
                "lagnaSign": lagna_navamsa,
                "planets": navamsa_planets
            },
            "dasha_data": {
                "current_mahadasha": current_md["planet"] if current_md else base["dasha_data"].get("current_mahadasha"),
                "mahadasha_start_date": current_md["startDate"] if current_md else None,
                "mahadasha_end_date": current_md["endDate"] if current_md else base["dasha_data"].get("mahadasha_end_date"),
                "current_antardasha": current_ad["planet"] if current_ad else base["dasha_data"].get("current_antardasha"),
                "antardasha_start_date": current_ad["startDate"] if current_ad else None,
                "antardasha_end_date": current_ad["endDate"] if current_ad else base["dasha_data"].get("antardasha_end_date"),
                "current_pratyantar": current_pt["planet"] if current_pt else None,
                "pratyantar_end_date": current_pt["endDate"] if current_pt else None,
                "timeline": dasha_timeline
            }
        }

        print(json.dumps(result, default=str))

    except Exception as e:
        import traceback
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
