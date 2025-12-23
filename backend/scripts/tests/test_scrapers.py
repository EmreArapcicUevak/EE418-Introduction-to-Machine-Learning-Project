#!/usr/bin/env python3
"""
Test script for running OLX and Nekretnine scrapers with duplicate checking
Saves data to database after each page for long-running scrapes
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.scrapers.olx_scraper import OLXScraper
from scripts.scrapers.nekretnine_scraper import NekretnineScraper

# Load environment variables
load_dotenv()


def test_olx_scraper(max_pages=5):
    """Test OLX scraper with database integration and page-by-page saving"""
    print("\n" + "="*70)
    print("🧪 TESTING OLX SCRAPER")
    print("="*70)
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return {"saved": 0, "duplicates": 0, "errors": 0, "total": 0}
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Initialize scraper with page callback for saving
    from scrapers.olx_scraper import OLXScraper
    import random
    import time
    from bs4 import BeautifulSoup
    from urllib.parse import urljoin
    
    scraper = OLXScraper(delay=(2.0, 5.0))
    scraper._init_driver()
    
    # Track statistics
    total_saved = 0
    total_duplicates = 0
    total_errors = 0
    total_found = 0
    all_sample_listings = []
    
    try:
        for page in range(1, max_pages + 1):
            print(f"\n{'='*70}")
            print(f"📄 SCRAPING PAGE {page}/{max_pages}")
            print(f"{'='*70}")
            
            # Fetch page HTML
            search_url = scraper.BASE_URL.format(page)
            html = scraper.fetch_page_source(search_url)
            
            if not html:
                print(f"⚠️  Could not fetch page {page}")
                continue
            
            # Parse listing links from page
            soup = BeautifulSoup(html, "lxml")
            main_section = soup.find("main", class_="articles")
            
            if not main_section:
                print(f"⚠️  No listings section found on page {page}")
                continue
            
            # Extract listing links
            links = [
                urljoin(scraper.DETAIL_BASE, a["href"])
                for a in main_section.find_all("a", href=True)
                if "/artikal/" in a.get("href", "")
            ]
            links = list(dict.fromkeys(links))  # Remove duplicates
            
            if not links:
                print(f"⚠️  No listings found on page {page}")
                break
            
            print(f"Found {len(links)} listings on page {page}")
            total_found += len(links)
            
            # Parse and save each listing
            page_saved = 0
            page_duplicates = 0
            page_errors = 0
            
            for idx, link in enumerate(links, 1):
                print(f"  Processing listing {idx}/{len(links)}...", end=" ")
                
                try:
                    # Extract external_id from URL to check database first
                    import re
                    url_match = re.search(r'/artikal/(\d+)', link)
                    if url_match:
                        external_id = f"olx_{url_match.group(1)}"
                        
                        # Check if already in database BEFORE parsing
                        existing = supabase.table('listings_olx')\
                            .select('id')\
                            .eq('external_id', external_id)\
                            .execute()
                        
                        if existing.data:
                            print("🔄 Duplicate (skipped)")
                            page_duplicates += 1
                            continue
                    
                    # Parse listing detail page only if not duplicate
                    listing = scraper.parse_detail_page(link)
                    
                    if not listing:
                        print("❌ No data")
                        page_errors += 1
                        continue
                    
                    # Save new listing
                    supabase.table('listings_olx').insert(listing).execute()
                    page_saved += 1
                    print("✅ Saved")
                    
                    # Keep sample
                    if len(all_sample_listings) < 1:
                        all_sample_listings.append(listing)
                    
                    # Random delay between listings
                    time.sleep(random.uniform(*scraper.delay))
                    
                except Exception as e:
                    page_errors += 1
                    print(f"❌ Error: {str(e)[:30]}")
            
            # Update totals
            total_saved += page_saved
            total_duplicates += page_duplicates
            total_errors += page_errors
            
            # Page summary
            print(f"\n📊 Page {page} Summary:")
            print(f"  🆕 Saved: {page_saved}")
            print(f"  🔄 Duplicates: {page_duplicates}")
            print(f"  ❌ Errors: {page_errors}")
            print(f"\n📈 Running Total:")
            print(f"  ✅ Total saved: {total_saved}")
            print(f"  🔄 Total duplicates: {total_duplicates}")
            print(f"  ❌ Total errors: {total_errors}")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraping interrupted by user")
    except Exception as e:
        print(f"\n❌ Scraping error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scraper._close_driver()
    
    # Print final results
    print("\n" + "="*70)
    print("📊 FINAL OLX SCRAPING RESULTS")
    print("="*70)
    print(f"  ✅ Total found: {total_found}")
    print(f"  💾 Saved to database: {total_saved}")
    print(f"  🔄 Duplicates skipped: {total_duplicates}")
    print(f"  ❌ Errors: {total_errors}")
    print(f"  📄 Pages scraped: {max_pages}")
    
    # Show sample listing
    if all_sample_listings:
        print("\n📋 Sample OLX Listing:")
        sample = all_sample_listings[0]
        for key, value in list(sample.items())[:8]:
            if value is not None:
                print(f"    {key}: {value}")
    
    return {
        "saved": total_saved,
        "duplicates": total_duplicates,
        "errors": total_errors,
        "total": total_found
    }


def test_nekretnine_scraper(max_pages=2):
    """Test Nekretnine scraper with database integration"""
    print("\n" + "="*70)
    print("🧪 TESTING NEKRETNINE.BA SCRAPER")
    print("="*70)
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Initialize scraper with Supabase client
    scraper = NekretnineScraper(
        delay=(2, 4), 
        headless=True, 
        supabase_client=supabase
    )
    
    # Run scraper with page-by-page saving
    result = scraper.scrape_listings(
        max_pages=max_pages,
        save_per_page=True
    )
    
    # Print results
    if result.get('success'):
        print("\n📊 Nekretnine.ba Scraping Results:")
        print(f"  ✅ Total found: {result['total_found']}")
        print(f"  🆕 New listings: {result['new_count']}")
        print(f"  🔄 Duplicates skipped: {result['duplicate_count']}")
        print(f"  💾 Saved to database: {result['saved_count']}")
        print(f"  📄 Pages scraped: {result['pages_scraped']}")
        
        # Show sample listing
        if result['listings']:
            print("\n📋 Sample Nekretnine Listing:")
            sample = result['listings'][0]
            for key, value in sample.items():
                if value is not None:
                    print(f"    {key}: {value}")
    else:
        print(f"\n❌ Scraping failed: {result.get('error')}")


def run_full_scrape(olx_pages=10, nekretnine_pages=10):
    """Run both scrapers for production scraping"""
    print("\n" + "="*70)
    print("🚀 STARTING FULL SCRAPE - BOTH SOURCES")
    print("="*70)
    print(f"OLX Pages: {olx_pages}")
    print(f"Nekretnine Pages: {nekretnine_pages}")
    print("Features: ✅ Duplicate checking, ✅ Page-by-page saving")
    print()
    
    # Test OLX
    olx_result = test_olx_scraper(max_pages=olx_pages)
    
    print("\n" + "-"*70 + "\n")
    
    # Test Nekretnine
    test_nekretnine_scraper(max_pages=nekretnine_pages)
    
    print("\n" + "="*70)
    print("✅ FULL SCRAPE COMPLETED")
    print("="*70)
    if olx_result:
        print(f"OLX: {olx_result['saved']} saved, {olx_result['duplicates']} duplicates")
    print("="*70)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test scrapers with database integration")
    parser.add_argument("--source", choices=["olx", "nekretnine", "both"], default="both",
                       help="Which scraper to test")
    parser.add_argument("--olx-pages", type=int, default=5,
                       help="Number of pages to scrape from OLX")
    parser.add_argument("--nekretnine-pages", type=int, default=2,
                       help="Number of pages to scrape from Nekretnine")
    parser.add_argument("--full", action="store_true",
                       help="Run full production scrape (100 pages each)")
    
    args = parser.parse_args()
    
    if args.full:
        run_full_scrape(olx_pages=100, nekretnine_pages=100)
    elif args.source == "olx":
        test_olx_scraper(max_pages=args.olx_pages)
    elif args.source == "nekretnine":
        test_nekretnine_scraper(max_pages=args.nekretnine_pages)
    else:
        run_full_scrape(olx_pages=args.olx_pages, nekretnine_pages=args.nekretnine_pages)
