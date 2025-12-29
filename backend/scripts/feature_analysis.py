"""
Quick feature diagnostics for listings.

Fetches rows from Supabase (default table: listings_olx) and prints:
- Row counts, missing ratios
- Basic stats for numeric columns
- Cardinality / top values for categoricals

Run:
    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
    python backend/scripts/feature_analysis.py --limit 5000 --table listings_olx
"""

import argparse
import os
from pathlib import Path
from typing import List

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

# Allow imports from backend/app if needed later
BACKEND_DIR = Path(__file__).resolve().parents[1]


def fetch_rows(table: str, limit: int | None) -> pd.DataFrame:
    """Fetch rows from Supabase into a DataFrame (paginates until limit or exhaustion)."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/KEY are required.")

    client = create_client(supabase_url, supabase_key)
    batch_size = 1000
    offset = 0
    rows: list[dict] = []

    while True:
        upper = offset + batch_size - 1
        query = client.table(table).select("*").range(offset, upper)
        if limit is not None:
            # Stop at requested limit
            remaining = max(limit - offset, 0)
            if remaining <= 0:
                break
            upper = offset + min(batch_size, remaining) - 1
            query = client.table(table).select("*").range(offset, upper)

        resp = query.execute()
        batch = resp.data or []
        if not batch:
            break
        rows.extend(batch)
        offset += len(batch)
        if limit is not None and offset >= limit:
            break

    return pd.DataFrame(rows)


def describe_numeric(df: pd.DataFrame, cols: List[str]) -> None:
    subset = [c for c in cols if c in df.columns]
    if not subset:
        return
    print("\nNumeric summary:")
    print(df[subset].describe().T[["count", "mean", "std", "min", "25%", "50%", "75%", "max"]])
    print("\nMissing ratios:")
    print((df[subset].isnull().mean() * 100).round(2).sort_values(ascending=False))


def describe_categorical(df: pd.DataFrame, cols: List[str], top_n: int = 20) -> None:
    subset = [c for c in cols if c in df.columns]
    if not subset:
        return
    print("\nCategorical summary (top values):")
    for col in subset:
        missing = df[col].isnull().mean() * 100
        print(f"\n{col} (missing: {missing:.2f}%):")
        print(df[col].value_counts(dropna=False).head(top_n))


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description="Feature diagnostics for listings")
    parser.add_argument("--table", default="listings_olx", help="Supabase table to inspect")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to fetch (default: all)")
    args = parser.parse_args()

    df = fetch_rows(args.table, args.limit)
    if df.empty:
        print("No data returned.")
        return

    print(f"Fetched {len(df)} rows from {args.table}")

    numeric_cols = [
        "price_numeric",
        "rooms",
        "square_m2",
        "latitude",
        "longitude",
        "predicted_price",
        "price_difference",
        "deal_score"
    ]
    categorical_cols = [
        "ad_type",
        "condition",
        "equipment",
        "heating",
        "municipality",
        "level"
    ]

    describe_numeric(df, numeric_cols)
    describe_categorical(df, categorical_cols)

    # Quick pairwise correlation (numeric only, including predicted_price if present)
    corr_cols = [c for c in numeric_cols + ["predicted_price", "price_difference", "deal_score"] if c in df.columns]
    if corr_cols:
        print("\nCorrelation matrix (numeric):")
        corr_df = df[corr_cols].apply(pd.to_numeric, errors="coerce")
        corr_df = corr_df.dropna(axis=1, how="all")
        if corr_df.empty:
            print("No numeric data available after coercion.")
        else:
            print(corr_df.corr().round(2))


if __name__ == "__main__":
    main()
