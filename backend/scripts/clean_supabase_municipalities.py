"""
Map and clean municipality values directly in Supabase tables.

Usage:
  python backend/scripts/clean_supabase_municipalities.py \
    --table listings_olx --table listings_nekretnine

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) in env.
"""

import argparse
import os
from typing import Iterable, Tuple

from dotenv import load_dotenv
from supabase import Client, create_client

from municipality_mapper import map_municipality


def supabase_client() -> Client:
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY are required")
    return create_client(url, key)


def fetch_municipalities(client: Client, table: str):
    # Only fetch needed columns to reduce payload
    resp = client.table(table).select("id, municipality").execute()
    return resp.data or []


def clean_table(client: Client, table: str, apply_changes: bool) -> Tuple[int, int, int]:
    """
    Returns (updated, dropped, total).
    updated: rows whose municipality was changed to canonical
    dropped: rows set inactive because they could not be mapped
    """
    rows = fetch_municipalities(client, table)
    updated = dropped = 0
    total = len(rows)

    for row in rows:
        raw = row.get("municipality")
        mapped = map_municipality(raw)
        row_id = row["id"]

        if mapped is None:
            dropped += 1
            if apply_changes:
                client.table(table).update({"is_active": False}).eq("id", row_id).execute()
                client.table(table).delete().eq("id", row_id).execute()
            continue

        if mapped != raw:
            updated += 1
            if apply_changes:
                client.table(table).update({"municipality": mapped}).eq("id", row_id).execute()

    return updated, dropped, total


def main(tables: Iterable[str], apply_changes: bool):
    client = supabase_client()

    for table in tables:
        updated, dropped, total = clean_table(client, table, apply_changes)
        action = "APPLIED" if apply_changes else "DRY-RUN"
        print(f"[{action}] {table}: total={total}, mapped={updated}, dropped(unmapped set inactive)={dropped}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean municipality values in Supabase tables.")
    parser.add_argument("--table", action="append", required=True, help="Supabase table to clean (repeatable).")
    parser.add_argument("--apply", action="store_true", help="Apply updates. Without this flag runs in dry-run mode.")
    args = parser.parse_args()

    main(args.table, apply_changes=args.apply)
