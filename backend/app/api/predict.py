from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ml_runtime.predict import predict_price
from app.core.logging import logger


router = APIRouter()


class PredictRequest(BaseModel):
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)

    condition: str
    ad_type: str
    property_type: str

    rooms: int = Field(gt=0)
    square_m2: float = Field(gt=0)

    equipment: str
    level: int
    heating: str


@router.post("/predict")
def predict(request: PredictRequest):
    payload = request.dict()
    audit_context = {
        "event": "prediction_request",
        "ad_type": payload.get("ad_type"),
        "property_type": payload.get("property_type"),
        "condition": payload.get("condition"),
        "rooms": payload.get("rooms"),
        "square_m2": payload.get("square_m2"),
        "has_coords": bool(payload.get("latitude") and payload.get("longitude")),
    }
    try:
        logger.info("Prediction request started", extra={**audit_context, "status": "started"})
        price = predict_price(payload)
        logger.info("Prediction request completed", extra={**audit_context, "status": "success"})
        return {"predicted_price": price}
    except ValueError as e:
        logger.warning("Prediction validation failed", extra={**audit_context, "status": "validation_error"})
        raise HTTPException(
            status_code=400,
            detail="Invalid input for prediction.",
        ) from None
    except Exception as e:
        logger.exception("Prediction failed", extra={**audit_context, "status": "error", "stage": "predict_price"})
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please try again later.",
        ) from None
