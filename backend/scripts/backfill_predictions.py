"""
Backfill ML-based predictions and pricing signals for existing listings.

For each listing:
- predict a fair market price (sale or rent)
- compare it with the listed price
- compute a deal score relative to the current market
- mark listings as underpriced / overpriced

Required env vars:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    SALES_MODEL_PATH
    RENTALS_MODEL_PATH

Run with:
    python backend/scripts/backfill_predictions.py
"""

import os
import sys
from pathlib import Path
from types import SimpleNamespace

import joblib
from dotenv import load_dotenv
from supabase import create_client

# ------------------------------------------------------------------
# Path setup so imports work when running as a script
# ------------------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from app.ml.features.build_features import build_features_from_request
from app.ml.poi.poi_loader import load_poi_data

# ------------------------------------------------------------------
# Config
# ------------------------------------------------------------------

BATCH_SIZE = 200
DEFAULT_PLACE = "Sarajevo Canton, Bosnia and Herzegovina"
DEFAULT_TABLE = "listings_olx"


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def ad_type_key(ad_type: str) -> str:
    """Normalize ad type to 'sale' or 'rent'."""
    if ad_type and ad_type.lower().startswith(("rent", "iznaj")):
        return "rent"
    return "sale"


def deal_score_from_diff(diff_pct: float, min_diff: float, max_diff: float) -> int:
    """
    Convert relative price difference to a deal score in range [0, 100].

    Negative diff -> cheaper than expected -> higher score
    Positive diff -> overpriced -> lower score
    """
    if max_diff == min_diff:
        return 50

    # clamp inside observed market range
    diff_pct = max(min_diff, min(max_diff, diff_pct))
    score = (max_diff - diff_pct) / (max_diff - min_diff) * 100
    return int(round(max(0, min(100, score))))


def to_float(val, default=None):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def build_features_from_row(row: dict, poi_data):
    """Prepare model input from raw DB row."""
    lon = to_float(row.get("longitude"))
    lat = to_float(row.get("latitude"))

    if lon is None or lat is None:
        raise ValueError("Missing coordinates")

    req = SimpleNamespace(
        longitude=lon,
        latitude=lat,
        condition=row.get("condition") or "Unknown",
        rooms=to_float(row.get("rooms"), 0.0),
        square_m2=to_float(row.get("square_m2"), 0.0),
        equipment=row.get("equipment") or "Unknown",
        level=int(to_float(row.get("level"), 0)),
        heating=row.get("heating") or "Other",
    )

    return build_features_from_request(req, poi_data)


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------

def main():
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    sales_model_path = os.getenv("SALES_MODEL_PATH")
    rentals_model_path = os.getenv("RENTALS_MODEL_PATH")

    place = os.getenv("PLACE_NAME", DEFAULT_PLACE)
    table = os.getenv("LISTINGS_TABLE", DEFAULT_TABLE)

    if not supabase_url or not supabase_key:
        raise RuntimeError("Supabase credentials are missing")

    if not sales_model_path or not rentals_model_path:
        raise RuntimeError("Model paths are not set")

    def resolve_model_path(p: str) -> Path:
        path = Path(p)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        if not path.exists():
            raise FileNotFoundError(f"Model not found: {path}")
        return path

    sales_model_path = resolve_model_path(sales_model_path)
    rentals_model_path = resolve_model_path(rentals_model_path)

    print("Connecting to Supabase…")
    supabase = create_client(supabase_url, supabase_key)

    print(f"Loading POIs for {place}…")
    poi_data = load_poi_data(place)

    print("Loading ML models…")
    sales_model = joblib.load(sales_model_path)
    rentals_model = joblib.load(rentals_model_path)


    stats = {
        "sale": {"min": float("inf"), "max": float("-inf")},
        "rent": {"min": float("inf"), "max": float("-inf")},
    }

    pending = []
    offset = 0

    print("Pass 1: predicting prices and collecting stats")

    while True:
        res = (
            supabase.table(table)
            .select(
                "id, ad_type, price_numeric, rooms, square_m2, "
                "condition, equipment, level, heating, latitude, longitude"
            )
            .range(offset, offset + BATCH_SIZE - 1)
            .execute()
        )

        rows = res.data or []
        if not rows:
            break

        for row in rows:
            try:
                X = build_features_from_row(row, poi_data)

                key = ad_type_key(row.get("ad_type"))
                model = rentals_model if key == "rent" else sales_model

                predicted = float(model.predict(X)[0])
                predicted_int = int(round(predicted))

                actual = row.get("price_numeric")
                diff_pct = None
                price_diff = None
                is_under = None
                is_over = None

                if actual is not None:
                    price_diff = actual - predicted
                    diff_pct = price_diff / predicted if predicted else 0.0

                    stats[key]["min"] = min(stats[key]["min"], diff_pct)
                    stats[key]["max"] = max(stats[key]["max"], diff_pct)

                    is_under = actual < predicted * 0.95
                    is_over = actual > predicted * 1.05

                pending.append({
                    "id": row["id"],
                    "ad_type": row.get("ad_type"),
                    "predicted_price": predicted_int,
                    "diff_pct": diff_pct,
                    "price_diff": int(round(price_diff)) if price_diff is not None else None,
                    "is_underpriced": is_under,
                    "is_overpriced": is_over,
                })

            except Exception as e:
                print(f"Skipping id={row.get('id')}: {e}")

        offset += BATCH_SIZE
        print(f"  processed {offset} rows")

    # Anchor ranges around zero so scoring behaves reasonably
    for key in stats:
        if stats[key]["min"] > 0:
            stats[key]["min"] = 0.0
        if stats[key]["max"] < 0:
            stats[key]["max"] = 0.0

    print("Diff stats:", stats)

    # --------------------------------------------------------------
    # PASS 2: compute deal scores and update DB
    # --------------------------------------------------------------

    print("Pass 2: writing updates")
    updated = 0

    for item in pending:
        try:
            payload = {
                "predicted_price": item["predicted_price"]
            }

            if item["diff_pct"] is not None:
                key = ad_type_key(item["ad_type"])
                score = deal_score_from_diff(
                    item["diff_pct"],
                    stats[key]["min"],
                    stats[key]["max"],
                )

                payload.update({
                    "price_difference": item["price_diff"],
                    "deal_score": score,
                    "is_underpriced": item["is_underpriced"],
                    "is_overpriced": item["is_overpriced"],
                })

            supabase.table(table).update(payload).eq("id", item["id"]).execute()
            updated += 1

        except Exception as e:
            print(f"Update failed for id={item.get('id')}: {e}")

    print(f"Finished. Updated {updated} rows in '{table}'.")


if __name__ == "__main__":
    main()
