"""
Backfill predicted_price, price_difference, deal_score, is_underpriced, is_overpriced
for existing listings in Supabase (default table: listings_olx).

Run:
    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
    export SALES_MODEL_PATH=... RENTALS_MODEL_PATH=...
    python backend/scripts/backfill_predictions.py
"""

import os
import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Tuple

import joblib
import numpy as np
from dotenv import load_dotenv
from supabase import Client, create_client

BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from app.ml.features.build_features import build_features_from_request
from app.ml.poi.poi_loader import load_poi_data


APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent

BATCH_SIZE = 200
DEFAULT_PLACE = "Sarajevo, Bosnia and Herzegovina"
DEFAULT_TABLE = "listings_olx"


def compute_deal_metrics(actual: float, predicted: float) -> Tuple[float, float, bool, bool]:
    """Return (price_difference, deal_score, is_underpriced, is_overpriced)."""
    price_diff = actual - predicted
    diff_pct = price_diff / predicted if predicted else 0.0

    # Deal score: 100 when price matches prediction, 0 when price is 100% off
    deal_score = max(0.0, min(100.0, 100.0 - abs(diff_pct) * 100.0))

    is_underpriced = actual < predicted * 0.95
    is_overpriced = actual > predicted * 1.05

    return price_diff, deal_score, is_underpriced, is_overpriced


def get_model_for_ad_type(ad_type: str, sales_model, rentals_model):
    if ad_type and str(ad_type).lower().startswith(("rent", "iznajmljivanje")):
        return rentals_model
    return sales_model


def build_feature_row(row: dict, poi_data) -> np.ndarray:
    """Convert a listing row to model features."""
    req = SimpleNamespace(
        longitude=row["longitude"],
        latitude=row["latitude"],
        condition=row.get("condition"),
        rooms=row.get("rooms"),
        square_m2=row.get("square_m2"),
        equipment=row.get("equipment"),
        level=row.get("level"),
        heating=row.get("heating"),
    )
    return build_features_from_request(req, poi_data)


def main():
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    sales_model_path = os.getenv("SALES_MODEL_PATH")
    rentals_model_path = os.getenv("RENTALS_MODEL_PATH")
    place = os.getenv("PLACE_NAME", DEFAULT_PLACE)
    table = os.getenv("LISTINGS_TABLE", DEFAULT_TABLE)

    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/KEY are required.")
    if not sales_model_path or not rentals_model_path:
        raise RuntimeError("SALES_MODEL_PATH and RENTALS_MODEL_PATH must be set.")

    # Resolve model paths relative to backend/ if not absolute
    def resolve_model_path(raw: str) -> Path:
        path = Path(raw.strip('"').strip("'"))
        if not path.is_absolute():
            path = BACKEND_DIR / path
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        return path

    sales_model_path = resolve_model_path(sales_model_path)
    rentals_model_path = resolve_model_path(rentals_model_path)

    supabase: Client = create_client(supabase_url, supabase_key)

    print(f"Loading POI data for {place}...")
    poi_data = load_poi_data(place)

    print("Loading models...")
    sales_model = joblib.load(sales_model_path)
    rentals_model = joblib.load(rentals_model_path)

    offset = 0
    total_updated = 0

    while True:
        resp = supabase.table(table).select(
            "id, ad_type, price_numeric, rooms, square_m2, condition, "
            "equipment, level, heating, latitude, longitude"
        ).range(offset, offset + BATCH_SIZE - 1).execute()

        rows = resp.data or []
        if not rows:
            break

        for row in rows:
            try:
                if row.get("latitude") is None or row.get("longitude") is None:
                    continue

                model = get_model_for_ad_type(row.get("ad_type"), sales_model, rentals_model)
                X = build_feature_row(row, poi_data)
                predicted_price = float(model.predict(X)[0])
                predicted_price_int = int(round(predicted_price))

                update_payload = {"predicted_price": predicted_price_int}

                if row.get("price_numeric"):
                    price_diff, deal_score, is_underpriced, is_overpriced = compute_deal_metrics(
                        float(row["price_numeric"]), predicted_price
                    )
                    price_diff_int = int(round(price_diff))
                    deal_score_int = int(round(deal_score))
                    update_payload.update({
                        "price_difference": price_diff_int,
                        "deal_score": deal_score_int,
                        "is_underpriced": is_underpriced,
                        "is_overpriced": is_overpriced,
                    })

                supabase.table(table).update(update_payload).eq("id", row["id"]).execute()

                total_updated += 1
            except Exception as exc:
                print(f"Skipping id={row.get('id')} due to error: {exc}")

        offset += BATCH_SIZE
        print(f"Processed {offset} rows so far, updated {total_updated}")

    print(f"Done. Updated {total_updated} rows in {table}.")


if __name__ == "__main__":
    main()
