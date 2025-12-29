from app.ml.model_registry import get_model_by_ad_type
from app.ml.features.build_features import build_features_from_request
from app.schemas.predict import PredictRequest

def _predict_price(model, features) -> float:
    """
    Low-level ML prediction wrapper.
    """
    price = model.predict(features)[0]
    return float(price)


def predict_price_service(
    payload: PredictRequest,
    poi_data: dict,
    sales_model,
    rentals_model,
) -> float:
    """
    High-level prediction service.
    """
    model = get_model_by_ad_type(
        payload.ad_type,
        sales_model,
        rentals_model,
    )

    features = build_features_from_request(
        payload,
        poi_data,
    )

    return _predict_price(model, features)
