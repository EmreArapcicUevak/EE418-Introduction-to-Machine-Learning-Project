# api_enhanced.py
"""
Enhanced API endpoints for multi-source property listings
Supports listings_olx, listings_nekretnine, and all_listings view
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from supabase import Client
import os
from dotenv import load_dotenv
from supabase import create_client
from statistics import mean, median
from collections import Counter

load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


def calculate_listing_statistics(listings: list) -> dict:
    if not listings:
        return {}

    def safe_values(key):
        return [x[key] for x in listings if x.get(key) is not None]

    stats = {}

    prices = safe_values("price_numeric")
    sizes = safe_values("square_m2")
    price_per_m2 = safe_values("price_per_m2")
    rooms = safe_values("rooms")

    stats["price"] = {
        "average": round(mean(prices), 2) if prices else None,
        "median": round(median(prices), 2) if prices else None,
        "min": min(prices) if prices else None,
        "max": max(prices) if prices else None,
    }

    stats["size_m2"] = {
        "average": round(mean(sizes), 2) if sizes else None
    }

    stats["price_per_m2"] = {
        "average": round(mean(price_per_m2), 2) if price_per_m2 else None
    }

    stats["rooms"] = {
        "average": round(mean(rooms), 2) if rooms else None
    }

    for field in ["municipality", "condition", "heating"]:
        values = safe_values(field)
        counter = Counter(values)
        stats[field] = {
            "most_common": counter.most_common(1)[0][0] if counter else None,
            "distribution": dict(counter)
        }

    distance_fields = [
        "closest_hospital_m",
        "closest_school_m",
        "closest_supermarket_m",
        "closest_bus_stop_m",
        "closest_tram_stop_m",
    ]

    stats["accessibility"] = {
        field.replace("_m", ""): round(mean(safe_values(field)), 2)
        if safe_values(field) else None
        for field in distance_fields
    }

    return stats


@router.get("/api/v2/listings")
async def get_listings_v2(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),

    search: Optional[str] = None,
    municipality: Optional[str] = None,
    property_type: Optional[str] = None,
    ad_type: Optional[str] = None,

    price_min: Optional[int] = None,
    price_max: Optional[int] = None,
    rooms_min: Optional[float] = None,
    rooms_max: Optional[float] = None,
    size_min: Optional[float] = None,
    size_max: Optional[float] = None,

    deal_score_min: Optional[int] = None,

    sort_by: str = Query("deal-score", pattern="^(deal-score|newest|price-low|price-high)$"),
):
    """
    Fetch OLX property listings with filtering, sorting and pagination.
    """
    try:
        table = "listings_olx"

        query = supabase.table(table).select("*", count="exact")

        # text search
        if search:
            term = f"%{search}%"
            query = query.or_(
                f"title.ilike.{term},municipality.ilike.{term},description.ilike.{term}"
            )

        # filters
        if municipality:
            query = query.ilike("municipality", f"%{municipality}%")

        if property_type:
            query = query.eq("property_type", property_type)

        if ad_type:
            query = query.eq("ad_type", ad_type)

        if price_min is not None:
            query = query.gte("price_numeric", price_min)

        if price_max is not None:
            query = query.lte("price_numeric", price_max)

        if rooms_min is not None:
            query = query.gte("rooms", rooms_min)

        if rooms_max is not None:
            query = query.lte("rooms", rooms_max)

        if size_min is not None:
            query = query.gte("square_m2", size_min)

        if size_max is not None:
            query = query.lte("square_m2", size_max)

        if deal_score_min is not None:
            query = query.gte("deal_score", deal_score_min)

        # only active listings
        query = query.eq("is_active", True)

        # --- sorting ---
        if sort_by == "deal-score":
            # Best deals first, hide unscored listings
            query = query.not_.is_("deal_score", None)
            query = query.order("deal_score", desc=True)

        elif sort_by == "newest":
            query = query.order("publication_date", desc=True)

        elif sort_by == "price-high":
            query = query.order("price_numeric", desc=True)

        elif sort_by == "price-low":
            query = query.order("price_numeric", desc=False)

        else:
            # fallback: best deals
            query = query.not_.is_("deal_score", None)
            query = query.order("deal_score", desc=True)


        # pagination 
        query = query.range(offset, offset + limit - 1)

        response = query.execute()

        return {
            "success": True,
            "data": response.data or [],
            "count": len(response.data or []),
            "total": response.count,
            "offset": offset,
            "limit": limit,
            "source": "olx" ## OLX only
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch listings: {str(e)}"
        )


@router.get("/api/v2/listings/{source}/{listing_id}")
async def get_listing_detail(source: str, listing_id: int):
    """
    Get detailed information about a specific listing
    """
    try:
        if source not in ["olx", "nekretnine"]:
            raise HTTPException(status_code=400, detail="Invalid source. Use 'olx' or 'nekretnine'")
        
        table = f"listings_{source}"
        
        response = supabase.table(table).select("*").eq("id", listing_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        return {
            "success": True,
            "data": response.data
        }
    
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Listing not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/listings/similar/{source}/{listing_id}")
async def get_similar_listings(
    source: str,
    listing_id: int,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Find similar listings based on price, size, location
    """
    try:
        # Get the reference listing
        table = f"listings_{source}"
        ref_listing = supabase.table(table).select("*").eq("id", listing_id).single().execute()
        
        if not ref_listing.data:
            raise HTTPException(status_code=404, detail="Reference listing not found")
        
        ref = ref_listing.data
        
        # Search for similar listings across all sources
        query = supabase.table("all_listings").select("*")
        
        # Similar municipality
        if ref.get("municipality"):
            query = query.eq("municipality", ref["municipality"])
        
        # Price range ±20%
        if ref.get("price_numeric"):
            price = ref["price_numeric"]
            query = query.gte("price_numeric", price * 0.8)
            query = query.lte("price_numeric", price * 1.2)
        
        # Size range ±20%
        if ref.get("square_m2"):
            size = ref["square_m2"]
            query = query.gte("square_m2", size * 0.8)
            query = query.lte("square_m2", size * 1.2)
        
        # Exclude the reference listing itself
        query = query.neq("id", listing_id)
        
        # Only active listings
        query = query.eq("is_active", True)
        
        # Sort by deal score
        query = query.order("deal_score", desc=True)
        query = query.limit(limit)
        
        response = query.execute()
        
        return {
            "success": True,
            "reference_listing": ref,
            "similar_listings": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/api/v2/statistics/sales")
def get_sales_statistics():
    res = supabase.rpc(
        "fetch_sales_listings",
        {
            "p_limit": 1000000,  
            "p_offset": 0
        }
    ).execute()

    listings = res.data or []
    statistics = calculate_listing_statistics(listings)

    return {
        "type": "sale",
        "count": len(listings),
        "statistics": statistics
    }




@router.get("/api/v2/statistics/rentals")
def get_rentals_listings():
    res = supabase.rpc(
        "fetch_rentals_listings",
        {
            "p_limit": 1000000,  
            "p_offset": 0
        }
    ).execute()

    listings = res.data or []
    statistics = calculate_listing_statistics(listings)

    return {
        "type": "rent",
        "count": len(listings),
        "statistics": statistics
    }


@router.get("/api/v2/statistics/map-data")
async def get_map_data(
    municipality: Optional[str] = None,
    price_min: Optional[int] = None,
    price_max: Optional[int] = None,
    limit: int = Query(500, ge=1, le=1000)
):
    try:
        query = (
            supabase
            .table("all_listings")
            .select(
                "id, title, price_numeric, square_m2, rooms, municipality, "
                "latitude, longitude, deal_score, predicted_price, price_difference, source"
            )
            .eq("is_active", True)
            .not_.is_("price_numeric", None)
            .gt("price_numeric", 0)
            .not_.is_("latitude", None)
            .not_.is_("longitude", None)
            .gt("latitude", 42.0)
            .lt("latitude", 46.0)
            .gt("longitude", 15.0)
            .lt("longitude", 20.0)
        )

        if municipality:
            query = query.ilike("municipality", f"%{municipality}%")

        if price_min is not None:
            query = query.gte("price_numeric", price_min)

        if price_max is not None:
            query = query.lte("price_numeric", price_max)

        query = query.limit(limit)
        response = query.execute()

        for listing in response.data:
            deal_score = listing.get("deal_score")

            try:
                deal_score = float(deal_score) if deal_score is not None else 50
            except (ValueError, TypeError):
                deal_score = 50

            if deal_score >= 85:
                listing["marker_color"] = "#10b981"
                listing["fairness"] = "excellent"
            elif deal_score >= 70:
                listing["marker_color"] = "#3b82f6"
                listing["fairness"] = "good"
            elif deal_score >= 50:
                listing["marker_color"] = "#f59e0b"
                listing["fairness"] = "fair"
            else:
                listing["marker_color"] = "#ef4444"
                listing["fairness"] = "overpriced"

        return {
            "success": True,
            "data": response.data,
            "count": len(response.data)
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/api/v2/search")
async def search_listings(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Full-text search across listings
    """
    try:
        # Search in title and description
        query = supabase.table("all_listings").select("*")
        query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        query = query.eq("is_active", True)
        query = query.order("deal_score", desc=True)
        query = query.limit(limit)
        
        response = query.execute()
        
        return {
            "success": True,
            "query": q,
            "data": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/filters/options")
async def get_filter_options():
    """
    Get all available filter options (municipalities, property types, etc.)
    """
    try:
        # Get distinct municipalities
        municipalities_response = supabase.table("listings_olx").select("municipality").eq("is_active", True).execute()
        municipalities = list(set([l["municipality"] for l in municipalities_response.data if l.get("municipality")]))
        
        # Get distinct property types
        property_types_response = supabase.table("listings_olx").select("property_type").eq("is_active", True).execute()
        property_types = list(set([l["property_type"] for l in property_types_response.data if l.get("property_type")]))
        
        # Get distinct ad types
        ad_types_response = supabase.table("listings_olx").select("ad_type").eq("is_active", True).execute()
        ad_types = list(set([l["ad_type"] for l in ad_types_response.data if l.get("ad_type")]))
        
        return {
            "success": True,
            "filters": {
                "municipalities": sorted(municipalities),
                "property_types": sorted(property_types),
                "ad_types": sorted(ad_types),
                "price_range": {
                    "min": 0,
                    "max": 1000000,
                    "step": 10000
                },
                "rooms_range": {
                    "min": 0,
                    "max": 10,
                    "step": 0.5
                },
                "size_range": {
                    "min": 0,
                    "max": 500,
                    "step": 10
                }
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v2/sync/status")
async def get_sync_status():
    """
    Get the status of data synchronization from sources
    """
    try:
        response = supabase.table("source_sync_status").select("*").order("last_sync_at", desc=True).execute()
        
        return {
            "success": True,
            "sources": response.data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
