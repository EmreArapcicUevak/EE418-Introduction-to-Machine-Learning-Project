from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_poi_data, get_sales_model, get_rentals_model
from app.schemas.predict import PredictRequest, PredictResponse
from app.services.price_prediction import predict_price_service


router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    poi_data = Depends(get_poi_data),
    sales_model = Depends(get_sales_model),
    rentals_model = Depends(get_rentals_model),
):
    try:
        price = predict_price_service(
            payload,
            poi_data,
            sales_model,
            rentals_model,
        )
        return PredictResponse(predicted_price=price)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
