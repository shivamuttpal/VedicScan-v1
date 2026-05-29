import swisseph as swe
import math
from datetime import datetime, timedelta

class VedicV2Engine:
    def __init__(self):
        # 1. Initialize Swiss Ephemeris with Lahiri Ayanamsa (Vedic Standard)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        self.RASHIS = [
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ]
        
        self.NAKSHATRAS = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
            "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
            "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]

        self.DASHA_PLANETS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
        self.DASHA_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}

    def _get_planet_data(self, jd_ut, body_id, body_name):
        """Calculates precise position for a single planet"""
        flags = swe.FLG_SIDEREAL | swe.FLG_SWIEPH
        res = swe.calc_ut(jd_ut, body_id, flags)
        lon = res[0][0] # Longitude
        
        rashi_idx = int(lon // 30)
        nak_idx = int(lon / (13 + 1/3))
        
        return {
            "name": body_name,
            "absolute_degree": lon,
            "rashi_id": rashi_idx + 1, # 1-12
            "rashi": self.RASHIS[rashi_idx],
            "degree_in_rashi": lon % 30,
            "nakshatra_id": nak_idx + 1, # 1-27
            "nakshatra": self.NAKSHATRAS[nak_idx % 27], # Modulo to handle edges
            "pada": int(((lon % (13 + 1/3)) / 3.333333) + 1)
        }

    def calculate_full_chart(self, dob, tob, lat, lon, tz_offset):
        """
        Main function to get the complete 'Snapshot' for Maharshi AI.
        dob: "YYYY-MM-DD"
        tob: "HH:MM"
        lat/lon: float (e.g., 12.97, 77.59)
        tz_offset: float (e.g., 5.5)
        """
        
        # 1. Capture "NOW" for the AI's context
        now = datetime.now()
        
        # 2. Time Conversion for Birth
        dt_local = datetime.strptime(f"{dob} {tob}", "%Y-%m-%d %H:%M")
        hour_utc = dt_local.hour + (dt_local.minute / 60.0) - tz_offset
        jd_ut = swe.julday(dt_local.year, dt_local.month, dt_local.day, hour_utc)
        
        # 3. Calculate Lagna (Ascendant)
        swe.set_topo(lat, lon, 0)
        houses = swe.houses(jd_ut, lat, lon, b'A')[0] # 'A' = Equal/Whole Sign
        ascendant_lon = houses[0]
        
        asc_rashi_idx = int(ascendant_lon // 30)
        lagna_data = {
            "sign": self.RASHIS[asc_rashi_idx],
            "degree": ascendant_lon % 30,
            "absolute_degree": ascendant_lon
        }

        # 4. Calculate Planets
        planets = {}
        # Map swe constants
        body_map = {
            "Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS, 
            "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER, 
            "Venus": swe.VENUS, "Saturn": swe.SATURN, "Rahu": swe.MEAN_NODE
        }
        
        for name, pid in body_map.items():
            planets[name] = self._get_planet_data(jd_ut, pid, name)
            
        # Calculate Ketu (Always 180 degrees from Rahu)
        ketu_lon = (planets["Rahu"]["absolute_degree"] + 180) % 360
        rashi_idx_k = int(ketu_lon // 30)
        nak_idx_k = int(ketu_lon / (13 + 1/3))
        planets["Ketu"] = {
            "name": "Ketu",
            "absolute_degree": ketu_lon,
            "rashi": self.RASHIS[rashi_idx_k],
            "nakshatra": self.NAKSHATRAS[nak_idx_k % 27]
        }

        # 5. Calculate Vimshottari Dasha
        dasha_data = self._calculate_dasha(planets["Moon"]["absolute_degree"], dt_local)

        # 6. Output JSON with "Meta" for AI Context
        return {
            "status": "success",
            "meta": {
                "current_date": now.strftime("%Y-%m-%d"),
                "current_time": now.strftime("%H:%M"),
                "current_weekday": now.strftime("%A"),
                "note": "Use these values as the 'Target Date' for any timing queries."
            },
            "birth_details": {
                "dob": dob, "tob": tob, "lat": lat, "lon": lon
            },
            "chart_data": {
                "Lagna": lagna_data,
                "Planets": planets
            },
            "dasha_data": dasha_data
        }

    def _calculate_dasha(self, moon_lon, birth_date):
        """Internal method to calculate Mahadasha/Antardasha stack"""
        # Calculate balance of dasha at birth
        nak_len = 13 + 1/3
        nak_pos = moon_lon % nak_len
        nak_idx = int(moon_lon / nak_len)
        
        # Identifying the Birth Lord
        root_ruler_idx = nak_idx % 9
        birth_lord = self.DASHA_PLANETS[root_ruler_idx]
        
        # Balance Calculation
        fraction_passed = nak_pos / nak_len
        fraction_left = 1.0 - fraction_passed
        total_years = self.DASHA_YEARS[birth_lord]
        balance_years = total_years * fraction_left
        
        # Project forward to NOW
        current_date = datetime.now()
        
        # Start iterating from birth date
        cursor_date = birth_date + timedelta(days=balance_years * 365.25)
        
        # If we are still in the first dasha 
        if cursor_date > current_date:
            active_md = birth_lord
            md_end_date = cursor_date
            md_start_date = birth_date # Approx
        else:
            # Loop through subsequent dashas
            curr_idx = (root_ruler_idx + 1) % 9
            while True:
                planet = self.DASHA_PLANETS[curr_idx]
                duration = self.DASHA_YEARS[planet]
                end_date = cursor_date + timedelta(days=duration * 365.25)
                
                if end_date > current_date:
                    active_md = planet
                    md_end_date = end_date
                    md_start_date = cursor_date
                    break
                
                cursor_date = end_date
                curr_idx = (curr_idx + 1) % 9

        # Calculate Antardasha (Bhukti)
        md_planet_idx = self.DASHA_PLANETS.index(active_md)
        ad_cursor = md_start_date
        active_ad = ""
        ad_end_date = None
        
        for i in range(9):
            ad_planet_name = self.DASHA_PLANETS[(md_planet_idx + i) % 9]
            ad_duration_years = (self.DASHA_YEARS[active_md] * self.DASHA_YEARS[ad_planet_name]) / 120.0
            ad_end = ad_cursor + timedelta(days=ad_duration_years * 365.25)
            
            if ad_end > current_date:
                active_ad = ad_planet_name
                ad_end_date = ad_end
                break
            
            ad_cursor = ad_end

        return {
            "current_mahadasha": active_md,
            "mahadasha_end_date": md_end_date.strftime("%Y-%m-%d"),
            "current_antardasha": active_ad,
            "antardasha_end_date": ad_end_date.strftime("%Y-%m-%d")
        }