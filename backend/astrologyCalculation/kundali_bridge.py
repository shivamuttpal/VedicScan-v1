"""
kundali_bridge.py — stdin → stdout bridge for the Vedic engine.

Reads a JSON object from stdin:
  { "dob": "YYYY-MM-DD", "tob": "HH:MM",
    "lat": float, "lon": float, "tz_offset": float }

Writes the full chart JSON to stdout.
Any Python exception is written to stderr and exits with code 1.

The heavy lifting (sidereal lagna fix, dasha, navamsa, dignity …) is all
inside vedic_engine.VedicEngine — this file is intentionally thin.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from vedic_engine import VedicEngine
except Exception as exc:
    print(json.dumps({"status": "error", "message": f"Import error: {exc}"}))
    sys.exit(1)


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            raise ValueError("Empty input received from Node.js")

        data = json.loads(raw)

        required = ["dob", "tob", "lat", "lon"]
        missing = [k for k in required if k not in data]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

        engine = VedicEngine()
        result = engine.calculate_full_chart(
            dob=data["dob"],
            tob=data["tob"],
            lat=float(data["lat"]),
            lon=float(data["lon"]),
            tz_offset=float(data.get("tz_offset", 5.5)),
        )

        print(json.dumps(result, default=str))

    except Exception as exc:
        import traceback
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
