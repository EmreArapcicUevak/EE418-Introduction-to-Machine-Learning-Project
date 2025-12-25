# api_favorites.py
"""
User favorites and saved listings API
Works with the new multi-source database structure
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from supabase import Client
import os
from dotenv import load_dotenv
from supabase import create_client
from app.services.auth import AuthService

load_dotenv()

router = APIRouter()

# Initialize clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
auth_service = AuthService(supabase)


class AddFavoriteRequest(BaseModel):
    source: str  # 'olx' or 'nekretnine'
    listing_id: int


class RemoveFavoriteRequest(BaseModel):
    listing_id: int
    source: str


from fastapi import Query, HTTPException
from datetime import datetime

@router.post("/api/v2/favorites")
async def add_favorite(
    listing_id: int = Query(...),
    source: str = Query(...),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """
    Add a listing to user's favorites using query params.
    """
    try:
        # Normalize source
        source = source.replace("_ba", "").replace("_rs", "")

        print(
            f"Adding favorite: user_id={current_user['id']}, "
            f"source={source}, listing_id={listing_id}"
        )

        # Check if already favorited
        existing = (
            supabase
            .table("user_favorites")
            .select("id")
            .eq("user_id", current_user["id"])
            .eq("source", source)
            .eq("listing_id", listing_id)
            .execute()
        )

        if existing.data:
            return {
                "success": True,
                "message": "Listing already in favorites",
            }

        # Insert favorite
        favorite_data = {
            "user_id": current_user["id"],
            "source": source,
            "listing_id": listing_id,
            "saved_at": datetime.utcnow().isoformat(),
        }

        response = (
            supabase
            .table("user_favorites")
            .insert(favorite_data)
            .execute()
        )

        return {
            "success": True,
            "message": "Added to favorites",
            "data": response.data[0] if response.data else None,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding favorite: {str(e)}",
        )



@router.get("/api/v2/favorites")
async def get_favorites(
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Return user's favorite listings with full listing data.
    """
    try:
        response = supabase.rpc(
            "get_user_favorites",
            {"p_user_id": current_user["id"]}
        ).execute()

        # Attach source to each favorite item
        favorites = response.data or []
        for fav in favorites:
            fav["source"] = "olx"  # or use fav["source"] if available

        return {
            "success": True,
            "data": favorites,
            "count": len(favorites),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch favorites: {str(e)}"
        )

@router.delete("/api/v2/favorites")
async def remove_favorite(
    listing_id: int = Query(...),
    source: str = Query(...),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """
    Remove a listing from user's favorites using query params.
    """
    try:
        source = source.replace("_ba", "").replace("_rs", "")

        response = (
            supabase
            .table("user_favorites")
            .delete()
            .eq("user_id", current_user["id"])
            .eq("listing_id", listing_id)
            .eq("source", source)
            .execute()
        )

        if not response.data:
            return {
                "success": False,
                "message": "Favorite not found or already removed",
            }

        return {
            "success": True,
            "message": "Removed from favorites",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error removing favorite: {str(e)}",
        )



@router.get("/api/v2/favorites/check/{source}/{listing_id}")
async def check_favorite(
    source: str,
    listing_id: int,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Check if a listing is in user's favorites
    """
    try:
        response = supabase.table("user_favorites") \
            .select("*") \
            .eq("user_id", current_user["id"]) \
            .eq("source", source) \
            .eq("listing_id", listing_id) \
            .execute()
        
        is_favorite = len(response.data) > 0
        
        return {
            "success": True,
            "is_favorite": is_favorite,
            "data": response.data[0] if is_favorite else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v2/notifications")
async def get_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Get user notifications
    """
    try:
        query = supabase.table("user_notifications") \
            .select("*") \
            .eq("user_id", current_user["id"])
        
        if unread_only:
            query = query.eq("is_read", False)
        
        query = query.order("created_at", desc=True).limit(50)
        
        response = query.execute()
        
        return {
            "success": True,
            "data": response.data,
            "count": len(response.data) if response.data else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/v2/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Mark a notification as read
    """
    try:
        response = supabase.table("user_notifications") \
            .update({"is_read": True, "read_at": datetime.now().isoformat()}) \
            .eq("id", notification_id) \
            .eq("user_id", current_user["id"]) \
            .execute()
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v2/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Mark all user notifications as read
    """
    try:
        response = supabase.table("user_notifications") \
            .update({"is_read": True, "read_at": datetime.now().isoformat()}) \
            .eq("user_id", current_user["id"]) \
            .eq("is_read", False) \
            .execute()
        
        return {
            "success": True,
            "message": "All notifications marked as read"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
