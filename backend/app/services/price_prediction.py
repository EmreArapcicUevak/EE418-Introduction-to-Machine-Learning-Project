# app/services/price_prediction.py

from app.ml.model_registry import get_model_by_ad_type
from app.ml.features.build_features import build_features_from_request
from app.ml.predictor import predict_price


def predict_price_service(payload, app_state):
    model = get_model_by_ad_type(payload.ad_type, app_state)
    features = build_features_from_request(payload, app_state.poi_data)
    return predict_price(model, features)
