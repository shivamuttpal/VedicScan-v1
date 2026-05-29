import swisseph as swe
import math
from datetime import datetime

class VedicCalculatorHighPrecision:
    def __init__(self):
        # Set the Ayanamsa to LAHIRI (The Vedic Standard)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        self.RASHIS = [
            "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
            "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
        ]

        self.NAKSHATRAS = [
            "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
            "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
            "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
            "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
            "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
        ]

    def get_moon_details(self, date_str, time_str, tz_offset_hours):
        """
        Calculates the accurate Vedic Moon Sign and Nakshatra.
        
        Parameters:
        date_str (str): "YYYY-MM-DD"
        time_str (str): "HH:MM" (Local Time)
        tz_offset_hours (float): Timezone offset (e.g., 5.5 for India, -5.0 for EST)
        
        Returns:
        dict: { "sign": str, "nakshatra": str, "degree": float }
        """
        # 1. Parse Date and Time
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        
        # 2. Convert to UTC Hour (Decimal)
        # We subtract the timezone offset to get to Greenwich time
        hour_decimal = dt.hour + (dt.minute / 60.0) - tz_offset_hours
        
        # 3. Calculate Julian Day (Universal Time)
        jd_ut = swe.julday(dt.year, dt.month, dt.day, hour_decimal)
        
        # 4. Calculate Moon Position (Sidereal)
        # swe.FLG_SIDEREAL = Use Vedic Zodiac (Lahiri)
        # swe.FLG_SWIEPH = Use high precision ephemeris
        calc_flag = swe.FLG_SIDEREAL | swe.FLG_SWIEPH
        
        # result[0] is the Longitude
        result = swe.calc_ut(jd_ut, swe.MOON, calc_flag)
        moon_deg = result[0][0] # Get longitude
        
        # 5. Convert to Rashi & Nakshatra
        rashi_index = int(moon_deg // 30)
        rashi_name = self.RASHIS[rashi_index]
        
        nakshatra_index = int(moon_deg / (13 + 1/3))
        nakshatra_name = self.NAKSHATRAS[nakshatra_index]
        
        return {
            "sign": rashi_name,
            "nakshatra": nakshatra_name,
            "degree": round(moon_deg, 2)
        }