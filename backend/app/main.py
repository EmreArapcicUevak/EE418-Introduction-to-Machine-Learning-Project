# main.py
import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our custom modules
from app.services.auth import AuthService
from app.models.models import (
    UserSignUp, UserSignIn, UserProfileUpdate,
    UserPreferences,

)
from app.core.exceptions import unhandled_exception_handler
from app.api.api_enhanced import router as enhanced_router
from app.api.api_favorites import router as favorites_router
from app.api.predict import router as predict_router
from app.api.health import router as health_router

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Admin client for operations that need to bypass RLS
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else supabase

# Initialize auth service
auth_service = AuthService(supabase)

app = FastAPI(title="Real Estate Price Predictor API", version="1.0.0")

app.add_exception_handler(Exception, unhandled_exception_handler)

# Include enhanced API routers
app.include_router(enhanced_router, prefix="/api", tags=["Enhanced Listings API"])
app.include_router(favorites_router, prefix="/api", tags=["User Favorites & Saved Searches"])
app.include_router(predict_router, prefix="/api", tags=["Price Prediction"])
app.include_router(health_router, prefix="/api", tags=["Health Check"])


# Allow your Expo App to connect (restricted origins when credentials are allowed)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================
#                      API ROUTES
# ===========================================================

@app.get("/")
def root():
    return {"message": "Real Estate Price Predictor API", "status": "running"}


# ===========================================================
#              AUTHENTICATION ENDPOINTS
# ===========================================================

@app.post("/auth/signup")
async def signup(user_data: UserSignUp):
    """Register a new user"""
    try:
        # Sign up with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Create user profile
        profile_data = {
            "full_name": user_data.full_name,
            "phone": user_data.phone
        }
        await auth_service.create_user_profile(
            response.user.id,
            user_data.email,
            profile_data
        )
        
        return {
            "message": "User created successfully",
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/signin")
async def signin(credentials: UserSignIn):
    """Sign in existing user"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/auth/signout")
async def signout(current_user: dict = Depends(auth_service.get_current_user)):
    """Sign out current user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/auth/me")
async def get_current_user_profile(current_user: dict = Depends(auth_service.get_current_user)):
    """Get current user's profile"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile


# ===========================================================
#              USER PROFILE ENDPOINTS
# ===========================================================

@app.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Update user profile"""
    update_data = profile_update.dict(exclude_unset=True)
    
    updated_profile = await auth_service.update_user_profile(
        current_user["id"],
        update_data
    )
    
    return {"message": "Profile updated", "profile": updated_profile}


@app.put("/profile/preferences")
async def update_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """Update user search preferences"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update preferences
    update_data = {"preferences": preferences.dict(exclude_unset=True)}
    updated_profile = await auth_service.update_user_profile(
        current_user["id"],
        update_data
    )
    
    return {"message": "Preferences updated", "preferences": updated_profile.get("preferences")}


@app.get("/profile/preferences")
async def get_preferences(current_user: dict = Depends(auth_service.get_current_user)):
    """Get user preferences"""
    profile = await auth_service.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile.get("preferences", {})
