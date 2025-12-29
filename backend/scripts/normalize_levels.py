"""
Normalize `level` values to integers.

Rules:
- "20+"        -> 20
- "Suteren"    -> -1
- "Prizemlje"  -> 0
- "Visoko prizemlje" -> 0
- "Minus N"    -> -N (e.g., "Minus 2" -> -2)
- Numeric strings (e.g., "3", "14", "7") -> int(value)
- 20+ floors clamp to 20

Run:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python backend/scripts/normalize_levels.py --apply
"""

import argparse
import os
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client


def normalize_level(raw) -> Optional[int]:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return int(raw if raw <= 20 else 20)

    text = str(raw).strip()
    if not text:
        return None

    lower = text.lower()
    if lower == "suteren":
        return -1
    if lower in {"prizemlje", "visoko prizemlje"}:
        return 0
    if lower == "20+":
        return 20
    if lower.startswith("minus"):
        parts = lower.split()
        if len(parts) > 1:
            try:
                return -int(parts[1])
            except ValueError:
                return None
    try:
        val = int(float(text))
        return val if val <= 20 else 20
    except ValueError:
        return None


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Normalize level values to integers")
    parser.add_argument("--table", default="listings_olx", help="Supabase table")
    parser.add_argument("--apply", action="store_true", help="Persist updates to Supabase")
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/KEY are required.")

    client = create_client(supabase_url, supabase_key)
    batch_size = 1000
    offset = 0
    updated = 0
    scanned = 0

    while True:
        resp = (
            client.table(args.table)
            .select("id, level")
            .range(offset, offset + batch_size - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break

        for row in rows:
            scanned += 1
            current = row.get("level")
            normalized = normalize_level(current)
            if normalized is None or normalized == current:
                continue

            print(f"id={row['id']}: level '{current}' -> {normalized}")
            if args.apply:
                client.table(args.table).update({"level": normalized}).eq("id", row["id"]).execute()
                updated += 1

        offset += len(rows)

    if args.apply:
        print(f"Done. Updated {updated} rows (scanned {scanned}).")
    else:
        print(f"Dry run complete. Scanned {scanned} rows; rerun with --apply to write changes.")


if __name__ == "__main__":
    main()
