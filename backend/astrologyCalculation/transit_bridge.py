"""
transit_bridge.py — stdin → stdout bridge for transit calculations.

Input  JSON: { "lagna_sign_idx": 0-11 }
Output JSON: { jupiter_now, jupiter_ahead, waxing_windows }

Errors go to stderr; stdout always contains valid JSON.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from transit_calculator import compute_transits
except Exception as exc:
    print(json.dumps({"error": f"Import error: {exc}"}))
    sys.exit(1)


def main() -> None:
    try:
        raw  = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
        idx  = int(data.get("lagna_sign_idx", 0))
        out  = compute_transits(idx)
        print(json.dumps(out, default=str))
    except Exception as exc:
        import traceback
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
