# api_favorites.py
"""
User favorites and saved listings API
Works with the new multi-source database structure
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
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
    source: str
    listing_id: int


# ============================================================
#              USER FAVORITES
# ============================================================

@router.post("/api/v2/favorites")
async def add_favorite(
    request: AddFavoriteRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Add a listing to user's favorites
    """
    try:
        # Normalize source name (remove country suffix if present)
        source = request.source.replace('_ba', '').replace('_rs', '')
        
        print(f"Adding favorite: user_id={current_user['id']}, source={source}, listing_id={request.listing_id}")
        
        # Check if already favorited
        existing = supabase.table("user_favorites") \
            .select("*") \
            .eq("user_id", current_user["id"]) \
            .eq("source", source) \
            .eq("listing_id", request.listing_id) \
            .execute()
        
        if existing.data:
            return {
                "success": True,
                "message": "Listing already in favorites",
                "data": existing.data[0]
            }
        
        # Add to favorites
        favorite_data = {
            "user_id": current_user["id"],
            "source": source,
            "listing_id": request.listing_id,
            "saved_at": datetime.now().isoformat()
        }
        
        print(f"Inserting favorite_data: {favorite_data}")
        response = supabase.table("user_favorites").insert(favorite_data).execute()
        print(f"Insert response: {response}")
        
        return {
            "success": True,
            "message": "Added to favorites",
            "data": response.data[0] if response.data else None
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding favorite: {str(e)}")


@router.get("/api/v2/favorites")
async def get_favorites(
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Get all user's favorite listings with full details
    Uses the get_user_favorites() database function
    """
    try:
        print(f"Fetching favorites for user: {current_user['id']}")
        # Call the database function
        response = supabase.rpc("get_user_favorites", {"p_user_id": current_user["id"]}).execute()
        print(f"Database function response: {response.data}")
        
        # Transform the response to include all listing details
        favorites_data = []
        for item in (response.data or []):
            favorites_data.append({
                "id": item["id"],
                "title": item["title"],
                "price_numeric": float(item["price_numeric"]) if item.get("price_numeric") else None,
                "municipality": item["municipality"],
                "thumbnail_url": item.get("thumbnail_url"),
                "url": item["url"],
                "source": item["source"],
                "listing_id": item["listing_id"],
                "saved_at": item["saved_at"],
                "deal_score": float(item["deal_score"]) if item.get("deal_score") else None,
                "square_m2": float(item["square_m2"]) if item.get("square_m2") else None,
                "rooms": float(item["rooms"]) if item.get("rooms") else None,
                "level": item.get("level"),
                "heating": item.get("heating"),
                "condition": item.get("condition"),
                "year_built": item.get("year_built"),
                "property_type": item.get("property_type"),
                "ad_type": item.get("ad_type"),
                "equipment": item.get("equipment")
            })
        
        print(f"Returning {len(favorites_data)} favorites")
        return {
            "success": True,
            "data": favorites_data,
            "count": len(favorites_data)
        }
    
    except Exception as e:
        print(f"Database function failed: {str(e)}, trying fallback...")
        # Fallback to manual query if function doesn't exist yet
        try:
            print(f"Fetching user_favorites for user_id: {current_user['id']}")
            favorites = supabase.table("user_favorites") \
                .select("*") \
                .eq("user_id", current_user["id"]) \
                .order("saved_at", desc=True) \
                .execute()
            
            print(f"Found {len(favorites.data)} user_favorites records")
            
            # Manually fetch listing details
            result = []
            for fav in favorites.data:
                # Normalize source name
                source = fav["source"].replace("_ba", "").replace("_rs", "")
                table = f"listings_{source}"
                
                print(f"Fetching from {table} where id={fav['listing_id']}")
                listing = supabase.table(table).select("*").eq("id", fav["listing_id"]).execute()
                
                if listing.data:
                    listing_data = listing.data[0]
                    # Ensure consistent structure
                    result.append({
                        "id": listing_data["id"],
                        "title": listing_data["title"],
                        "price_numeric": float(listing_data["price_numeric"]) if listing_data.get("price_numeric") else None,
                        "municipality": listing_data["municipality"],
                        "thumbnail_url": listing_data.get("thumbnail_url"),
                        "url": listing_data.get("url"),
                        "source": source,
                        "listing_id": fav["listing_id"],
                        "saved_at": fav["saved_at"],
                        "deal_score": float(listing_data.get("deal_score", 0)) if listing_data.get("deal_score") else None,
                        "square_m2": float(listing_data.get("square_m2")) if listing_data.get("square_m2") else None,
                        "rooms": float(listing_data.get("rooms")) if listing_data.get("rooms") else None,
                        "level": listing_data.get("level"),
                        "heating": listing_data.get("heating"),
                        "condition": listing_data.get("condition"),
                        "year_built": listing_data.get("year_built"),
                        "property_type": listing_data.get("property_type"),
                        "ad_type": listing_data.get("ad_type"),
                        "equipment": listing_data.get("equipment")
                    })
                else:
                    print(f"Warning: Listing not found in {table} with id={fav['listing_id']}")
            
            print(f"Fallback returning {len(result)} favorites with full data")
            return {
                "success": True,
                "data": result,
                "count": len(result)
            }
        except Exception as fallback_error:
            import traceback
            traceback.print_exc()
            print(f"Fallback error: {str(fallback_error)}")
            raise HTTPException(status_code=500, detail=f"Error fetching favorites: {str(fallback_error)}")


@router.delete("/api/v2/favorites")
async def remove_favorite(
    request: RemoveFavoriteRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Remove a listing from user's favorites
    """
    try:
        # Normalize source name (remove country suffix if present)
        source = request.source.replace('_ba', '').replace('_rs', '')
        
        response = supabase.table("user_favorites") \
            .delete() \
            .eq("user_id", current_user["id"]) \
            .eq("source", source) \
            .eq("listing_id", request.listing_id) \
            .execute()
        
        return {
            "success": True,
            "message": "Removed from favorites"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing favorite: {str(e)}")


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


# ============================================================
#              SAVED SEARCHES
# ============================================================

class SavedSearchRequest(BaseModel):
    search_name: str
    search_criteria: dict
    notification_enabled: bool = False


@router.post("/api/v2/saved-searches")
async def create_saved_search(
    request: SavedSearchRequest,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Save a search query with optional notifications
    """
    try:
        search_data = {
            "user_id": current_user["id"],
            "search_name": request.search_name,
            "search_criteria": request.search_criteria,
            "notification_enabled": request.notification_enabled,
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table("user_saved_searches").insert(search_data).execute()
        
        return {
            "success": True,
            "message": "Search saved successfully",
            "data": response.data[0] if response.data else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving search: {str(e)}")


@router.get("/api/v2/saved-searches")
async def get_saved_searches(
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Get all user's saved searches
    """
    try:
        response = supabase.table("user_saved_searches") \
            .select("*") \
            .eq("user_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .execute()
        
        return {
            "success": True,
            "data": response.data,
            "count": len(response.data) if response.data else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/v2/saved-searches/{search_id}")
async def delete_saved_search(
    search_id: int,
    current_user: dict = Depends(auth_service.get_current_user)
):
    """
    Delete a saved search
    """
    try:
        response = supabase.table("user_saved_searches") \
            .delete() \
            .eq("id", search_id) \
            .eq("user_id", current_user["id"]) \
            .execute()
        
        return {
            "success": True,
            "message": "Saved search deleted"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#              USER NOTIFICATIONS
# ============================================================

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
