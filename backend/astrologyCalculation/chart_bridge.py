import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from vedic_engine import VedicV2Engine

def main():
    try:
        data = json.loads(sys.stdin.read())
        engine = VedicV2Engine()
        result = engine.calculate_full_chart(
            dob=data['dob'],
            tob=data['tob'],
            lat=float(data['lat']),
            lon=float(data['lon']),
            tz_offset=float(data.get('tz_offset', 5.5))
        )
        print(json.dumps(result))
    except Exception as e:
        json.dump({"status": "error", "message": str(e)}, sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
