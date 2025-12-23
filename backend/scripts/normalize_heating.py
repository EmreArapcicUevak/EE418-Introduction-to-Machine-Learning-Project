"""
Normalize `heating` values to the canonical HeatingType enum used by the API:

    - "Centralno (gradsko)"   -> "District Heating"
    - "Plin"                  -> "Gas Heating"
    - "Struja"                -> "Electric Heating"
    - "Centralno (Plin)"      -> "Central Gas Heating"
    - "Centralno (Kotlovnica) -> "Central (Boiler Room)"
    - everything else         -> "Other"

Dry-run by default; use --apply to persist.

Run:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python backend/scripts/normalize_heating.py --table listings_olx --apply
"""

import argparse
import os
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client


CANONICAL = {
    "centralno (gradsko)": "District Heating",
    "centralno (gradsko)": "District Heating",
    "plin": "Gas Heating",
    "struja": "Electric Heating",
    "centralno (plin)": "Central Gas Heating",
    "centralno (kotlovnica)": "Central (Boiler Room)",
    "ostalo": "Other",
}


def normalize_heating(raw) -> Optional[str]:
    if raw is None:
        return None
    key = str(raw).strip().lower()
    if not key:
        return None
    return CANONICAL.get(key, "Other")


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Normalize heating values to canonical set")
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
            .select("id, heating")
            .range(offset, offset + batch_size - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break

        for row in rows:
            scanned += 1
            current = row.get("heating")
            normalized = normalize_heating(current)
            if normalized is None or normalized == current:
                continue

            print(f"id={row['id']}: heating '{current}' -> {normalized}")
            if args.apply:
                client.table(args.table).update({"heating": normalized}).eq("id", row["id"]).execute()
                updated += 1

        offset += len(rows)

    if args.apply:
        print(f"Done. Updated {updated} rows (scanned {scanned}).")
    else:
        print(f"Dry run complete. Scanned {scanned} rows; rerun with --apply to write changes.")


if __name__ == "__main__":
    main()
