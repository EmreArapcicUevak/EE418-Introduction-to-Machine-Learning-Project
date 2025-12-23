"""
Print distinct municipalities and counts.

Usage:
  python backend/scripts/print_municipalities.py               # from Supabase all_listings
  python backend/scripts/print_municipalities.py --table listings_olx
  python backend/scripts/print_municipalities.py --csv data/flats.csv
"""

import argparse
import os
from collections import Counter
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client


def supabase_client():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY are required")
    return create_client(url, key)


def municipalities_from_supabase(table: str, active_only: bool = True) -> Counter:
    client = supabase_client()
    query = client.table(table).select("municipality")
    if active_only:
        query = query.eq("is_active", True)
    resp = query.execute()
    values = [row.get("municipality") or "Unknown" for row in resp.data or []]
    return Counter(values)


def municipalities_from_csv(csv_path: str) -> Counter:
    df = pd.read_csv(csv_path)
    col = df.get("municipality")
    if col is None:
        raise RuntimeError("CSV does not contain a 'municipality' column")
    values = col.fillna("Unknown").astype(str).tolist()
    return Counter(values)


def main():
    parser = argparse.ArgumentParser(description="List distinct municipalities with counts.")
    parser.add_argument("--table", default="all_listings", help="Supabase table name (default: all_listings)")
    parser.add_argument("--csv", help="Optional CSV path to read instead of Supabase.")
    parser.add_argument("--include-inactive", action="store_true", help="Include inactive rows (Supabase only).")
    parser.add_argument("--categories", action="store_true", help="Also show categories grouped by city (prefix before ' - ').")
    args = parser.parse_args()

    if args.csv:
        source = Path(args.csv).resolve()
        counts = municipalities_from_csv(str(source))
        print(f"Municipalities from CSV: {source}")
    else:
        counts = municipalities_from_supabase(args.table, active_only=not args.include_inactive)
        print(f"Municipalities from Supabase table '{args.table}' (active_only={not args.include_inactive})")

    print("=" * 60)

    if args.categories:
        category_counts = Counter()
        for muni, count in counts.items():
            # Treat prefixes like "Sarajevo - Centar" as category "Sarajevo"
            prefix = muni.split(" - ")[0] if isinstance(muni, str) else "Unknown"
            category_counts[prefix or "Unknown"] += count
        print("Categories (by city/prefix):")
        for cat, count in category_counts.most_common():
            print(f"  {cat}: {count}")
        print("-" * 60)

    print("Municipalities:")
    for muni, count in counts.most_common():
        print(f"{muni}: {count}")


if __name__ == "__main__":
    main()
