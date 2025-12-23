"""
Utility functions for mapping raw municipality strings to canonical names.

Usage example (pandas):
    from scripts.municipality_mapper import map_municipality
    df["municipality_clean"] = df["municipality"].apply(map_municipality)
    df = df.dropna(subset=["municipality_clean"])
"""

import argparse
import re
from pathlib import Path
from typing import Optional

import pandas as pd

# Canonical municipalities we keep
CANONICAL = {
    "Sarajevo - Centar",
    "Sarajevo - Novi Grad",
    "Sarajevo - Novo Sarajevo",
    "Sarajevo - Stari Grad",
    "Ilidža",
    "Vogošća",
    "Ilijaš",
    "Hadžići",
    "Trnovo",
}
CANONICAL_LOWER = {c.lower() for c in CANONICAL}


# Ordered list of (regex, canonical) pairs
PATTERN_MAP = [
    # Sarajevo - Centar
    (re.compile(r"centar|ohr|trg\s+solidarnosti|kod\s+ohr", re.I), "Sarajevo - Centar"),
    # Sarajevo - Novo Sarajevo
    (re.compile(r"novo\s*sarajevo|grbavica|h\.?\s?naselje|hrasno|pofali[cć]i|čengić|cengic", re.I), "Sarajevo - Novo Sarajevo"),
    # Sarajevo - Novi Grad
    (re.compile(r"novi\s*grad|alipaš|alipas|otoka|dobrinja|bu[cć]a|buće", re.I), "Sarajevo - Novi Grad"),
    # Sarajevo - Stari Grad
    (re.compile(r"stari\s*grad|baš?čaršija|bascarsija|š?trosmajerova", re.I), "Sarajevo - Stari Grad"),
    # Ilidža
    (re.compile(r"ilidž|ilidz|butmir|hrasnica|sokolovi[cć]|osjek|oštek|silve\s+rizvanbegovic", re.I), "Ilidža"),
    # Vogošća
    (re.compile(r"vogoš[cć]a|vogo", re.I), "Vogošća"),
    # Ilijaš
    (re.compile(r"ilijaš|ilijas", re.I), "Ilijaš"),
    # Hadžići
    (re.compile(r"hadži[cć]i|hadzici", re.I), "Hadžići"),
    # Trnovo
    (re.compile(r"trnovo", re.I), "Trnovo"),
]


def map_municipality(raw: Optional[str]) -> Optional[str]:
    """
    Map a raw municipality/location string to a canonical municipality.
    Returns None when no match is found (caller can drop those rows).
    """
    if not raw:
        return None

    text = raw.strip()
    lower = text.lower()

    # Already canonical?
    if lower in CANONICAL_LOWER:
        # Preserve original casing if user passed it canonical already
        return next(c for c in CANONICAL if c.lower() == lower)

    # Match patterns
    for pattern, target in PATTERN_MAP:
        if pattern.search(text):
            return target

    # Unmapped
    return None


def normalize_municipality_column(series):
    """
    Convenience helper for pandas Series. Returns a new Series with mapped values.
    """
    return series.apply(map_municipality)


def _cli():
    parser = argparse.ArgumentParser(description="Map raw municipalities to canonical values.")
    parser.add_argument("--csv", default="backend/scripts/data/flats.csv", help="Input CSV with a 'municipality' column.")
    parser.add_argument("--output", help="Output CSV path (default: adds _clean suffix).")
    args = parser.parse_args()

    src = Path(args.csv)
    if not src.exists():
        raise SystemExit(f"Input CSV not found: {src}")

    df = pd.read_csv(src)
    if "municipality" not in df.columns:
        raise SystemExit("CSV must contain a 'municipality' column.")

    df["municipality_clean"] = df["municipality"].apply(map_municipality)
    before = len(df)
    df = df.dropna(subset=["municipality_clean"])
    after = len(df)

    dst = Path(args.output) if args.output else src.with_name(f"{src.stem}_clean{src.suffix}")
    df.to_csv(dst, index=False)

    print(f"Mapped municipalities: kept {after}/{before} rows. Saved to {dst}")


if __name__ == "__main__":
    _cli()
