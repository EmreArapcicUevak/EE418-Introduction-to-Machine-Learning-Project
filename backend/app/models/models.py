# models.py
"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

# ===== Authentication Models =====

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserPreferences(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    preferred_municipalities: Optional[List[str]] = []
    preferred_property_types: Optional[List[str]] = []
    min_rooms: Optional[int] = None
    max_rooms: Optional[int] = None
    min_square_m2: Optional[float] = None
    max_square_m2: Optional[float] = None
    preferred_conditions: Optional[List[str]] = []
    notifications_enabled: Optional[bool] = True

class SavedListing(BaseModel):
    listing_id: int
    notes: Optional[str] = None

class UserInterest(BaseModel):
    interest_type: str  # saved_listing, search, preference
    data: Dict[str, Any]

# ===== Prediction Models =====

class PredictionInput(BaseModel):
    longitude: float
    latitude: float
    condition: str
    ad_type: str
    property_type: str
    rooms: int
    square_m2: float
    equipment: str
    level: int
    heating: str

class PredictionResponse(BaseModel):
    price: float
    prediction_id: Optional[int] = None

# ===== Response Models =====

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: Dict[str, Any]

class MessageResponse(BaseModel):
    message: str
    data: Optional[Any] = None
