#!/usr/bin/env python3
"""
Test Google Maps geocoding for Sarajevo addresses
"""

import os
from dotenv import load_dotenv
from scripts.scrapers.nekretnine_scraper import NekretnineScraper

# Load environment variables from .env file
load_dotenv()

# Test addresses from Sarajevo
test_addresses = [
    "Dvosoban stan Dobrinja 4, Sarajevo",
    "Marijin Dvor, Sarajevo",
    "Grbavica, Sarajevo",
    "Alipašino Polje, Sarajevo",
    "Ilidža, Sarajevo",
]

def test_geocoding():
    """Test geocoding with Google Maps API"""
    
    # Get API key from environment variable
    api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    
    if not api_key:
        print("❌ Error: GOOGLE_MAPS_API_KEY environment variable not set")
        print("\nTo set it:")
        print("  export GOOGLE_MAPS_API_KEY='your-api-key-here'")
        print("\nOr create a .env file with:")
        print("  GOOGLE_MAPS_API_KEY=your-api-key-here")
        return
    
    print("🧪 Testing Google Maps Geocoding for Sarajevo")
    print("=" * 70)
    print(f"API Key: {api_key[:10]}...{api_key[-4:]}\n")
    
    # Initialize scraper with Google Maps API
    scraper = NekretnineScraper(
        headless=True,
        google_maps_api_key=api_key
    )
    
    if not scraper.gmaps:
        print("❌ Google Maps client not initialized")
        return
    
    print("✅ Google Maps client initialized\n")
    
    # Test geocoding for each address
    for i, address in enumerate(test_addresses, 1):
        print(f"{i}. Testing: {address}")
        
        lat, lng = scraper.geocode_address(address, "Sarajevo")
        
        if lat and lng:
            print(f"   ✅ Success: {lat:.6f}, {lng:.6f}")
            print(f"   🔗 Google Maps: https://www.google.com/maps?q={lat},{lng}")
        else:
            print(f"   ❌ Failed to geocode")
        print()
    
    print("=" * 70)
    print("✅ Geocoding test complete!")


if __name__ == "__main__":
    test_geocoding()
