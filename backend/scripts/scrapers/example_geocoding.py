#!/usr/bin/env python3
"""
Example: Using Nekretnine scraper with Google Maps geocoding
"""

import os
from dotenv import load_dotenv
from scrapers.nekretnine_scraper import NekretnineScraper

# Load environment variables from .env file
load_dotenv()

def main():
    """Run scraper with optional Google Maps geocoding"""
    
    # Get API key from environment (optional)
    google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
    
    print("🏠 Nekretnine.ba Scraper with Geocoding")
    print("=" * 70)
    
    if google_api_key:
        print("✅ Google Maps API key found - geocoding enabled")
        print(f"   Key: {google_api_key[:10]}...{google_api_key[-4:]}")
    else:
        print("⚠️  No Google Maps API key - using Leaflet only")
        print("   To enable geocoding:")
        print("   export GOOGLE_MAPS_API_KEY='your-key-here'")
    
    print()
    
    # Initialize scraper
    scraper = NekretnineScraper(
        delay=(2, 4),
        headless=False,  # Set to True for production
        google_maps_api_key=google_api_key  # Optional
    )
    
    # Run scrape (1 page for testing)
    print("Starting scrape...")
    result = scraper.scrape_listings(
        max_pages=1,
        save_per_page=False
    )
    
    if result.get('success'):
        print("\n" + "=" * 70)
        print("✅ Scraping Complete!")
        print(f"  Total found: {result.get('total_found', 0)}")
        print(f"  New listings: {result.get('new_count', 0)}")
        
        # Analyze coordinates
        listings = result.get('listings', [])
        with_coords = sum(1 for l in listings if l.get('latitude'))
        without_coords = len(listings) - with_coords
        
        print(f"\n📍 Coordinate Statistics:")
        print(f"  With coordinates: {with_coords}/{len(listings)} ({with_coords/len(listings)*100:.1f}%)")
        print(f"  Without coordinates: {without_coords}")
        
        # Show sample with coordinates
        if with_coords > 0:
            print(f"\n📋 Sample listing with coordinates:")
            for listing in listings:
                if listing.get('latitude'):
                    print(f"  Title: {listing.get('title')}")
                    print(f"  Address: {listing.get('address')}")
                    print(f"  Coordinates: {listing.get('latitude')}, {listing.get('longitude')}")
                    print(f"  🔗 Map: https://www.google.com/maps?q={listing.get('latitude')},{listing.get('longitude')}")
                    break
    else:
        print(f"\n❌ Scraping failed: {result.get('error')}")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
