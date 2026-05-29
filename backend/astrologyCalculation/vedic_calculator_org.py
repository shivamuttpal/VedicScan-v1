import math
import datetime

class VedicCalculator:
    """
    A self-contained Vedic Astrology Calculator.
    Calculates Sidereal positions (Lahiri Ayanamsa) using orbital elements.
    No external libraries required.
    """

    def __init__(self):
        self.ayanamsa = 0.0
        # Zodiac Signs
        self.zodiac = [
            "Aries (Mesha)", "Taurus (Vrishaba)", "Gemini (Mithuna)", "Cancer (Karka)", 
            "Leo (Simha)", "Virgo (Kanya)", "Libra (Tula)", "Scorpio (Vrishchika)", 
            "Sagittarius (Dhanu)", "Capricorn (Makara)", "Aquarius (Kumbha)", "Pisces (Meena)"
        ]
        # Nakshatras
        self.nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
            "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", 
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", 
            "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]

    def _to_julian(self, year, month, day, hour, minute, timezone_offset):
        # Convert date to Julian Day
        if month <= 2:
            year -= 1
            month += 12
        A = year // 100
        B = 2 - A + (A // 4)
        day_fraction = (hour + minute / 60.0 - timezone_offset) / 24.0
        jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + day_fraction + B - 1524.5
        return jd

    def _normalize_degrees(self, deg):
        return deg % 360

    def _get_ayanamsa(self, jd):
        # Lahiri Ayanamsa Calculation (Approximate but accurate for general use)
        # Reference epoch J2000.0
        t = (jd - 2451545.0) / 36525.0
        # Mean obliquity of ecliptic
        epsilon = 23.439291 - 0.0130042 * t
        # Lahiri Ayanamsa base value for 2000 is approx 23.85 degrees
        # Precession rate approx 50.29 arcseconds per year
        ayanamsa = 23.85 + (50.29 / 3600) * ((jd - 2451545.0) / 365.25)
        return ayanamsa

    def _kepler_solve(self, M, e):
        # Solve Kepler's Equation for Eccentric Anomaly (E)
        E = M * (math.pi / 180.0) # Start with Mean Anomaly
        for _ in range(10): # 10 iterations is sufficient for precision
            delta_E = (M * (math.pi/180.0) - (E - e * math.sin(E))) / (1 - e * math.cos(E))
            E += delta_E
            if abs(delta_E) < 1e-6:
                break
        return E

    def _calculate_planet_pos(self, jd, planet_name):
        # Simplified Orbital Elements (J2000.0)
        # N = Longitude of ascending node, i = Inclination, w = Argument of perihelion
        # a = Semi-major axis, e = Eccentricity, M = Mean anomaly
        
        # Days since J2000
        d = jd - 2451545.0
        
        # Elements dictionary (Simplified VSOP87/Keplerian)
        elements = {
            'Sun':     {'N': 0.0, 'i': 0.0, 'w': 282.9404 + 4.70935e-5 * d, 'a': 1.000000, 'e': 0.016709 - 1.151e-9 * d, 'M': 356.0470 + 0.9856002585 * d},
            'Moon':    {'N': 125.1228 - 0.0529538083 * d, 'i': 5.1454, 'w': 318.0634 + 0.1643573223 * d, 'a': 60.2666, 'e': 0.054900, 'M': 115.3654 + 13.0649929509 * d},
            'Mars':    {'N': 49.5574 + 2.11081e-5 * d, 'i': 1.8497 - 4.3e-8 * d, 'w': 286.5016 + 2.92961e-5 * d, 'a': 1.523688, 'e': 0.093405 + 2.516e-9 * d, 'M': 19.4124 + 0.5240207766 * d},
            'Mercury': {'N': 48.3313 + 3.24587e-5 * d, 'i': 7.0048 + 5.00e-8 * d, 'w': 29.1241 + 1.01444e-5 * d, 'a': 0.387098, 'e': 0.205635 + 5.59e-10 * d, 'M': 168.6562 + 4.0923344368 * d},
            'Jupiter': {'N': 100.4542 + 2.76854e-5 * d, 'i': 1.3053 - 4.1e-8 * d, 'w': 273.8777 + 1.64505e-5 * d, 'a': 5.20256, 'e': 0.048498 + 4.469e-9 * d, 'M': 19.8950 + 0.0830853001 * d},
            'Venus':   {'N': 76.6806 + 2.46590e-5 * d, 'i': 3.3947 + 2.75e-8 * d, 'w': 54.8522 + 1.38374e-5 * d, 'a': 0.723332, 'e': 0.006773 - 1.302e-9 * d, 'M': 50.4160 + 1.6021302244 * d},
            'Saturn':  {'N': 113.6634 + 2.38980e-5 * d, 'i': 2.4857 - 2.5e-8 * d, 'w': 339.3939 + 2.97661e-5 * d, 'a': 9.55475, 'e': 0.055546 - 9.499e-9 * d, 'M': 317.0207 + 0.0334442282 * d}
        }
        
        p = elements.get(planet_name)
        if not p: return 0

        # Mean Anomaly in radians
        M_rad = self._normalize_degrees(p['M'])
        
        # Eccentric Anomaly
        E = self._kepler_solve(M_rad, p['e'])
        
        # True Anomaly (v) and distance (r)
        xv = p['a'] * (math.cos(E) - p['e'])
        yv = p['a'] * (math.sqrt(1.0 - p['e']**2) * math.sin(E))
        v = math.atan2(yv, xv)
        r = math.sqrt(xv**2 + yv**2)
        
        # Heliocentric position
        N_rad = math.radians(p['N'])
        i_rad = math.radians(p['i'])
        w_rad = math.radians(p['w'])
        
        xh = r * (math.cos(N_rad) * math.cos(v + w_rad) - math.sin(N_rad) * math.sin(v + w_rad) * math.cos(i_rad))
        yh = r * (math.sin(N_rad) * math.cos(v + w_rad) + math.cos(N_rad) * math.sin(v + w_rad) * math.cos(i_rad))
        zh = r * (math.sin(v + w_rad) * math.sin(i_rad))
        
        # Geocentric conversion (Simple approximation omitting perturbations)
        # We need Sun's coordinates to shift origin to Earth
        if planet_name == 'Sun':
            lon = math.degrees(math.atan2(yh, xh))
            return self._normalize_degrees(lon)
        else:
            # Need Sun's rectangular coordinates to subtract
            # Re-calculating Sun briefly for offset
            sun_p = elements['Sun']
            sun_M = self._normalize_degrees(sun_p['M'])
            sun_E = self._kepler_solve(sun_M, sun_p['e'])
            sun_xv = sun_p['a'] * (math.cos(sun_E) - sun_p['e'])
            sun_yv = sun_p['a'] * (math.sqrt(1.0 - sun_p['e']**2) * math.sin(sun_E))
            sun_v = math.atan2(sun_yv, sun_xv)
            sun_r = math.sqrt(sun_xv**2 + sun_yv**2)
            sun_w_rad = math.radians(sun_p['w'])
            # Earth coords are opposite of Sun
            xs = sun_r * math.cos(sun_v + sun_w_rad)
            ys = sun_r * math.sin(sun_v + sun_w_rad)
            
            # Geocentric coordinates
            xg = xh + xs 
            yg = yh + ys
            zg = zh 
            
            lon = math.degrees(math.atan2(yg, xg))
            return self._normalize_degrees(lon)

    def _calculate_lagna(self, jd, lat, lon_deg, sidereal_time_gst):
        # Calculate Local Sidereal Time
        lst = (sidereal_time_gst + lon_deg) % 360
        
        # Obliquity of ecliptic (approx 23.44)
        eps = math.radians(23.44)
        lst_rad = math.radians(lst)
        lat_rad = math.radians(lat)
        
        # Formula for Ascendant
        numerator = math.cos(lst_rad)
        denominator = -(math.sin(eps) * math.tan(lat_rad)) + (math.cos(eps) * math.sin(lst_rad))
        
        ascendant = math.degrees(math.atan2(numerator, denominator))
        
        # Quadrant adjustment
        # atan2 gives -180 to 180, normalize
        return self._normalize_degrees(ascendant)

    def generate_chart(self, year, month, day, hour, minute, lat, lon, tz_offset):
        """
        Main function to be called by the AI.
        Returns a dictionary of Vedic Positions.
        """
        jd = self._to_julian(year, month, day, hour, minute, tz_offset)
        ayanamsa = self._get_ayanamsa(jd)
        
        # Calculate GST (Greenwich Sidereal Time) for Lagna
        # Simplified GST formula
        T = (jd - 2451545.0) / 36525.0
        gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T**2 - T**3 / 38710000
        gst = self._normalize_degrees(gst)

        # Calculate Planets (Tropical first, then subtract Ayanamsa)
        planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
        results = {}
        
        results['Meta'] = {
            'J.D.': round(jd, 2),
            'Ayanamsa (Lahiri)': round(ayanamsa, 4),
            'Note': "Calculated using Keplerian Elements & Lahiri Ayanamsa"
        }

        # LAGNA (Ascendant)
        # Note: Lagna calculation here is purely geometric. 
        # For higher precision, the AI usually needs a dedicated library, 
        # but this geometric version works for most non-polar latitudes.
        lagna_tropical = self._calculate_lagna(jd, lat, lon, gst)
        lagna_vedic = self._normalize_degrees(lagna_tropical - ayanamsa)
        results['Ascendant'] = self._format_pos(lagna_vedic)

        for p in planets:
            trop_pos = self._calculate_planet_pos(jd, p)
            vedic_pos = self._normalize_degrees(trop_pos - ayanamsa)
            results[p] = self._format_pos(vedic_pos)
            
        # Rahu/Ketu (Mean Node approximation)
        # N = 125.1228 - 0.0529538083 * d (from Moon calc)
        d = jd - 2451545.0
        node_mean = self._normalize_degrees(125.1228 - 0.0529538083 * d)
        rahu_vedic = self._normalize_degrees(node_mean - ayanamsa)
        ketu_vedic = self._normalize_degrees(rahu_vedic + 180)
        
        results['Rahu'] = self._format_pos(rahu_vedic)
        results['Ketu'] = self._format_pos(ketu_vedic)

        return results

    def _format_pos(self, degree):
        sign_idx = int(degree // 30)
        sign_name = self.zodiac[sign_idx]
        deg_in_sign = degree % 30
        
        # Nakshatra Calc (13 deg 20 min per nakshatra)
        nak_idx = int(degree / 13.333333)
        nak_name = self.nakshatras[nak_idx]
        
        return {
            "sign": sign_name,
            "degree_absolute": round(degree, 2),
            "degree_in_sign": round(deg_in_sign, 2),
            "nakshatra": nak_name
        }

# Helper to run easily
def run_vedic_calculation(name, year, month, day, hour, minute, lat, lon, tz):
    calc = VedicCalculator()
    chart = calc.generate_chart(year, month, day, hour, minute, lat, lon, tz)
    return chart