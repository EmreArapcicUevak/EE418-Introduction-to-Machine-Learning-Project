from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.ml.features.build_features import build_features_from_request
from enum import Enum


router = APIRouter()

class HeatingType(str, Enum):
    district_heating = "District Heating"
    gas_heating = "Gas Heating"
    electric_heating = "Electric Heating"
    central_gas_heating = "Central Gas Heating"
    central_boiler_room = "Central (Boiler Room)"
    other = "Other"
    
class EquipmentType(str, Enum):
    furnished = "Furnished"
    semi_furnished = "Semi-furnished"
    unfurnished = "Unfurnished"
    
class AdType(str, Enum):
    sale = "Sale"
    rent = "Rent"

class ConditionTypeSale(str, Enum):
    renovated = "Renovated"
    new_build = "New Build"
    good_condition = "Good Condition"
    partially_renovated = "Partially Renovated"
    needs_renovation = "Needs Renovation"
    under_construction = "Under Construction"
    
    
class ConditionTypeRent(str, Enum):
    renovated = "Renovated"
    new_build = "New Build"
    good_condition = "Good Condition"
    partially_renovated = "Partially Renovated"


class PredictRequest(BaseModel):
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)

    condition: ConditionTypeSale | ConditionTypeRent
    ad_type: AdType

    rooms: int = Field(gt=0)
    square_m2: float = Field(gt=0)

    equipment: EquipmentType
    level: int = Field(ge=0, le=25)
    heating: HeatingType
    

@router.post("/predict")
def predict(payload: PredictRequest, request: Request):
    # shared poi data and models from app state
    poi_data = request.app.state.poi_data

    if payload.ad_type.lower() == "sale":
        model = request.app.state.sales_model
    elif payload.ad_type.lower() == "rent":
        model = request.app.state.rentals_model
    else:
        raise HTTPException(status_code=400, detail="Invalid ad_type")

    X = build_features_from_request(payload, poi_data)
    price = model.predict(X)[0]

    return {
        "predicted_price": float(price)
    }
