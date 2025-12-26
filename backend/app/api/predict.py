from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator

from app.ml.features.build_features import build_features_from_request
from enum import Enum

from app.services.price_prediction import predict_price_service


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
    


class ConditionType(str, Enum):
    renovated = "Renovated"
    new_build = "New Build"
    good_condition = "Good Condition"
    partially_renovated = "Partially Renovated"
    needs_renovation = "Needs Renovation"
    under_construction = "Under Construction"

ALLOWED_CONDITIONS = {
    "sale": {
        ConditionType.renovated,
        ConditionType.new_build,
        ConditionType.good_condition,
        ConditionType.partially_renovated,
        ConditionType.needs_renovation,
        ConditionType.under_construction,
    },
    "rent": {
        ConditionType.renovated,
        ConditionType.new_build,
        ConditionType.good_condition,
        ConditionType.partially_renovated,
    },
}


class PredictRequest(BaseModel):
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)

    condition: ConditionType
    ad_type: AdType

    rooms: int = Field(gt=0)
    square_m2: float = Field(gt=0)

    equipment: EquipmentType
    level: int = Field(ge=0, le=25)
    heating: HeatingType
    
    @model_validator(mode="after")
    def validate_condition_for_ad_type(self):
        ad_type_key = str(self.ad_type.value).casefold()
        allowed = ALLOWED_CONDITIONS.get(ad_type_key)
        if not allowed:
            raise ValueError(f"Unsupported ad type '{self.ad_type}'")
        if self.condition not in allowed:
            raise ValueError(
                f"Condition '{self.condition}' is not valid for ad type '{self.ad_type}'"
            )
        return self
    

@router.post("/predict")
def predict(payload: PredictRequest, request: Request):
    try:
        price = predict_price_service(payload, request.app.state)
        return {"predicted_price": price}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
