# auth.py
"""
Authentication and authorization utilities using Supabase Auth
"""
import os
from typing import Optional
from fastapi import HTTPException, Header
from supabase import Client

class AuthService:
    """Handles authentication and user management"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    def verify_token(self, authorization: str) -> dict:
        """
        Verify JWT token and return user data
        
        Args:
            authorization: Bearer token from Authorization header
            
        Returns:
            dict with user data (id, email, etc.)
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing authorization header")
        
        try:
            # Extract token from "Bearer <token>"
            if not authorization.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Invalid authorization format")
            
            token = authorization.replace("Bearer ", "")
            
            # Verify token with Supabase
            response = self.supabase.auth.get_user(token)
            
            if not response.user:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            
            return {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata or {}
            }
            
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    
    def get_current_user(self, authorization: Optional[str] = Header(None)) -> dict:
        """
        Dependency to get current authenticated user
        Use this in FastAPI route parameters
        """
        return self.verify_token(authorization)
    
    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Get user profile from database
        
        Args:
            user_id: User's UUID
            
        Returns:
            User profile dict or None
        """
        try:
            response = self.supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()
            return response.data
        except Exception:
            return None
    
    async def create_user_profile(self, user_id: str, email: str, profile_data: dict = None) -> dict:
        """
        Create a new user profile
        
        Args:
            user_id: User's UUID
            email: User's email
            profile_data: Additional profile data
            
        Returns:
            Created profile
        """
        profile = {
            "user_id": user_id,
            "email": email,
            "full_name": profile_data.get("full_name", "") if profile_data else "",
            "phone": profile_data.get("phone", "") if profile_data else "",
            "preferences": profile_data.get("preferences", {}) if profile_data else {}
        }
        
        response = self.supabase.table("user_profiles").insert(profile).execute()
        return response.data[0] if response.data else None
    
    async def update_user_profile(self, user_id: str, profile_data: dict) -> dict:
        """
        Update user profile
        
        Args:
            user_id: User's UUID
            profile_data: Data to update
            
        Returns:
            Updated profile
        """
        response = self.supabase.table("user_profiles").update(profile_data).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None
    
    async def save_user_interest(self, user_id: str, interest_type: str, interest_data: dict):
        """
        Save user interest/activity (e.g., saved listings, search preferences)
        
        Args:
            user_id: User's UUID
            interest_type: Type of interest (saved_listing, search, preference)
            interest_data: Interest data
        """
        interest = {
            "user_id": user_id,
            "interest_type": interest_type,
            "data": interest_data
        }
        
        response = self.supabase.table("user_interests").insert(interest).execute()
        return response.data[0] if response.data else None
    
    async def get_user_interests(self, user_id: str, interest_type: Optional[str] = None):
        """
        Get user interests/saved items
        
        Args:
            user_id: User's UUID
            interest_type: Filter by interest type (optional)
            
        Returns:
            List of user interests
        """
        query = self.supabase.table("user_interests").select("*").eq("user_id", user_id)
        
        if interest_type:
            query = query.eq("interest_type", interest_type)
        
        response = query.execute()
        return response.data
