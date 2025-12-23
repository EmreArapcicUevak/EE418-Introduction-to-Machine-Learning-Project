"""
Property Sync Service - Supabase Version
Orchestrates scraping from multiple sources and syncs to Supabase database
"""

import os
import sys
import time
import argparse
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Add scrapers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapers'))

from scripts.scrapers.olx_scraper import OLXScraper
from scripts.scrapers.nekretnine_scraper import NekretnineScraper


# Load environment variables
load_dotenv()


# Field mapping dictionary - maps Bosnian field names to database columns
FIELD_MAPPING = {
    # Geographic
    'adresa': 'address',
    'latitude': 'latitude',
    'longitude': 'longitude',
    
    # Property details
    'broj_kupatila': 'bathrooms',
    'primarna_orjentacija': 'orientation',
    'vrsta_poda': 'floor_type',
    'godina_izgradnje': 'year_built',
    'datum_objave': 'publication_date',
    
    # Boolean amenities
    'garaža': 'has_garage',
    'garaza': 'has_garage',
    'internet': 'has_internet',
    'kablovska_tv': 'has_cable_tv',
    'lift': 'has_elevator',
    'balkon': 'has_balcony',
    'podrum_tavan': 'has_basement',
    'podrum': 'has_basement',
    'tavan': 'has_basement',
    'parking': 'has_parking',
    'parking_mesto': 'has_parking',
}

# Boolean field indicators (field values that indicate True)
BOOLEAN_INDICATORS = ['da', 'yes', 'true', '✓', '✔', 'ima']

# Source to table mapping
SOURCE_TABLES = {
    'olx_ba': 'listings_olx',
    'nekretnine_ba': 'listings_nekretnine',
}


class SupabaseSyncService:
    """Manages syncing of property listings from multiple sources to Supabase"""
    
    def __init__(self, supabase_client: Client = None):
        """
        Initialize sync service
        
        Args:
            supabase_client: Supabase client instance (creates new one if not provided)
        """
        if supabase_client:
            self.supabase = supabase_client
        else:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
            
            self.supabase = create_client(supabase_url, supabase_key)
        
        # Initialize scrapers
        self.scrapers = {
            'olx_ba': OLXScraper(delay=(2, 4)),
            # 'nekretnine_ba': NekretnineScraper(delay=2.0),  # Uncomment when ready
        }
    
    def sync_all_sources(self, max_pages: int = 10) -> Dict:
        """
        Perform full sync from all sources
        
        Args:
            max_pages: Maximum pages to scrape per source
            
        Returns:
            Dictionary with sync statistics
        """
        print(f"\n{'='*60}")
        print(f"🔄 Starting FULL SYNC - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")
        
        total_stats = {
            'sources_synced': 0,
            'total_scraped': 0,
            'total_inserted': 0,
            'total_updated': 0,
            'total_errors': 0,
            'started_at': datetime.now(),
        }
        
        for source_name, scraper in self.scrapers.items():
            try:
                print(f"\n📡 Syncing source: {source_name.upper()}")
                stats = self._sync_source(source_name, scraper, max_pages)
                
                total_stats['sources_synced'] += 1
                total_stats['total_scraped'] += stats['scraped']
                total_stats['total_inserted'] += stats['inserted']
                total_stats['total_updated'] += stats['updated']
                
            except Exception as e:
                print(f"❌ Error syncing {source_name}: {str(e)}")
                total_stats['total_errors'] += 1
        
        # Mark expired listings
        try:
            expired_count = self._mark_expired_listings()
            print(f"\n🗑️  Marked {expired_count} expired listings as inactive")
        except Exception as e:
            print(f"⚠️  Warning: Could not mark expired listings: {str(e)}")
        
        total_stats['finished_at'] = datetime.now()
        total_stats['duration_seconds'] = (total_stats['finished_at'] - total_stats['started_at']).total_seconds()
        
        # Log sync results
        self._log_sync(total_stats)
        
        print(f"\n{'='*60}")
        print(f"✅ SYNC COMPLETE")
        print(f"{'='*60}")
        print(f"Sources synced: {total_stats['sources_synced']}")
        print(f"Total scraped: {total_stats['total_scraped']}")
        print(f"Inserted: {total_stats['total_inserted']}")
        print(f"Updated: {total_stats['total_updated']}")
        print(f"Duration: {total_stats['duration_seconds']:.1f}s")
        print(f"{'='*60}\n")
        
        return total_stats
    
    def _sync_source(self, source_name: str, scraper, max_pages: int) -> Dict:
        """Sync listings from a single source"""
        
        # Scrape listings
        print(f"  🌐 Scraping {source_name}...")
        scraped_listings = scraper.scrape_listings(max_pages=max_pages)
        print(f"  ✅ Scraped {len(scraped_listings)} listings")
        
        if not scraped_listings:
            return {'scraped': 0, 'inserted': 0, 'updated': 0}
        
        # Get existing listings from database
        existing_listings = self._get_existing_listings(source_name)
        existing_map = {listing['external_id']: listing for listing in existing_listings}
        
        # Separate new and updated listings
        new_listings = []
        updated_listings = []
        
        for listing in scraped_listings:
            external_id = listing.get('external_id')
            if not external_id:
                continue
            
            existing = existing_map.get(external_id)
            
            if existing:
                # Check if needs update
                if self._needs_update(listing, existing):
                    listing['id'] = existing['id']  # Keep existing ID
                    updated_listings.append(listing)
            else:
                new_listings.append(listing)
        
        print(f"  📊 New: {len(new_listings)}, Updates: {len(updated_listings)}")
        
        # Insert new listings
        inserted = 0
        if new_listings:
            inserted = self._insert_listings(new_listings, source_name)
            print(f"  ✅ Inserted {inserted} new listings")
        
        # Update existing listings
        updated = 0
        if updated_listings:
            updated = self._update_listings(updated_listings, source_name)
            print(f"  ✅ Updated {updated} listings")
        
        return {
            'scraped': len(scraped_listings),
            'inserted': inserted,
            'updated': updated
        }
    
    def _get_existing_listings(self, source: str) -> List[Dict]:
        """Get existing listings from Supabase for a source"""
        try:
            # Get the correct table for this source
            table_name = SOURCE_TABLES.get(source)
            if not table_name:
                print(f"  ⚠️  Warning: Unknown source '{source}', no table mapping found")
                return []
            
            response = self.supabase.table(table_name) \
                .select('id, external_id, price_numeric, title, last_updated') \
                .eq('is_active', True) \
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            print(f"  ⚠️  Warning: Could not fetch existing listings: {str(e)}")
            return []
    
    def _needs_update(self, new_listing: Dict, existing_listing: Dict) -> bool:
        """Check if a listing needs to be updated"""
        
        # Update if price changed
        if new_listing.get('price_numeric') != existing_listing.get('price_numeric'):
            return True
        
        # Update if title changed
        if new_listing.get('title') != existing_listing.get('title'):
            return True
        
        # Update if not updated in last 24 hours
        last_updated = existing_listing.get('last_updated')
        if last_updated:
            try:
                last_updated_dt = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                if datetime.now().timestamp() - last_updated_dt.timestamp() > 86400:  # 24 hours
                    return True
            except:
                pass
        
        return False
    
    def _insert_listings(self, listings: List[Dict], source: str) -> int:
        """Insert new listings into Supabase"""
        if not listings:
            return 0
        
        try:
            # Get the correct table for this source
            table_name = SOURCE_TABLES.get(source)
            if not table_name:
                print(f"  ❌ Error: Unknown source '{source}', no table mapping found")
                return 0
            
            # Prepare data for insertion
            insert_data = []
            for listing in listings:
                data = self._transform_listing_data(listing)
                insert_data.append(data)
            
            # Insert in batches of 100
            batch_size = 100
            total_inserted = 0
            
            for i in range(0, len(insert_data), batch_size):
                batch = insert_data[i:i+batch_size]
                response = self.supabase.table(table_name).insert(batch).execute()
                total_inserted += len(response.data) if response.data else 0
            
            return total_inserted
            
        except Exception as e:
            print(f"  ❌ Error inserting listings: {str(e)}")
            return 0
    
    def _transform_listing_data(self, listing: Dict) -> Dict[str, Any]:
        """
        Transform scraped listing data to database format
        Maps extra_* fields to structured columns and JSONB
        
        Args:
            listing: Raw scraped listing data
            
        Returns:
            Transformed data ready for database insertion
        """
        # Start with base fields (excluding 'source' since it's implicit in the table)
        data = {
            'external_id': listing.get('external_id'),
            'url': listing.get('url'),
            'title': listing.get('title'),
            'price_numeric': listing.get('price_numeric'),
            'municipality': listing.get('municipality'),
            'rooms': listing.get('rooms'),
            'square_m2': listing.get('square_m2'),
            'thumbnail_url': listing.get('thumbnail_url'),
            'description': listing.get('description'),
            'posted_date': listing.get('posted_date'),
            'scraped_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            'is_active': True,
        }
        
        # Add geographic coordinates if available
        if 'latitude' in listing and listing['latitude']:
            data['latitude'] = listing['latitude']
        if 'longitude' in listing and listing['longitude']:
            data['longitude'] = listing['longitude']
        
        # Add image URLs if available
        if 'image_urls' in listing and listing['image_urls']:
            # Store as list (will be converted to PostgreSQL array)
            if isinstance(listing['image_urls'], list):
                data['image_urls'] = listing['image_urls']
            elif isinstance(listing['image_urls'], str):
                # If it's already a JSON string, parse it
                try:
                    data['image_urls'] = json.loads(listing['image_urls'])
                except:
                    data['image_urls'] = [listing['image_urls']]
        
        # Process extra_* fields
        extra_fields_json = {}
        
        for key, value in listing.items():
            # Skip already processed fields
            if key in data or not key.startswith('extra_'):
                continue
            
            # Remove 'extra_' prefix
            field_name = key[6:]
            
            # Check if this field maps to a database column
            if field_name in FIELD_MAPPING:
                db_column = FIELD_MAPPING[field_name]
                
                # Handle boolean fields
                if db_column.startswith('has_'):
                    data[db_column] = self._parse_boolean(value)
                # Handle numeric fields
                elif db_column == 'bathrooms':
                    data[db_column] = self._parse_integer(value)
                # Handle date fields
                elif db_column == 'publication_date':
                    data[db_column] = self._parse_date(value)
                # Handle text fields
                else:
                    data[db_column] = str(value) if value else None
            else:
                # Store unmapped fields in extra_fields JSON
                extra_fields_json[field_name] = value
        
        # Add extra_fields JSON column
        if extra_fields_json:
            data['extra_fields'] = json.dumps(extra_fields_json)
        else:
            data['extra_fields'] = '{}'
        
        return data
    
    def _parse_boolean(self, value: Any) -> bool:
        """Parse various boolean representations"""
        if isinstance(value, bool):
            return value
        
        if value is None:
            return False
        
        value_str = str(value).lower().strip()
        
        # Check for boolean indicators
        return value_str in BOOLEAN_INDICATORS
    
    def _parse_integer(self, value: Any) -> Optional[int]:
        """Parse integer from various formats"""
        if isinstance(value, int):
            return value
        
        if value is None:
            return None
        
        try:
            # Extract first number from string
            match = re.search(r'\d+', str(value))
            if match:
                return int(match.group())
        except:
            pass
        
        return None
    
    def _parse_date(self, value: Any) -> Optional[str]:
        """Parse date from various formats"""
        if value is None:
            return None
        
        value_str = str(value).strip()
        
        # Try common date formats
        formats = [
            '%d.%m.%Y',  # 03.12.2025
            '%Y-%m-%d',  # 2025-12-03
            '%d/%m/%Y',  # 03/12/2025
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(value_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except:
                continue
        
        return None
    
    def _update_listings(self, listings: List[Dict], source: str) -> int:
        """Update existing listings in Supabase"""
        if not listings:
            return 0
        
        try:
            # Get the correct table for this source
            table_name = SOURCE_TABLES.get(source)
            if not table_name:
                print(f"  ❌ Error: Unknown source '{source}', no table mapping found")
                return 0
            
            updated_count = 0
            
            for listing in listings:
                listing_id = listing.get('id')
                if not listing_id:
                    continue
                
                # Check if price changed (for price history)
                old_price = None
                try:
                    old_response = self.supabase.table(table_name) \
                        .select('price_numeric') \
                        .eq('id', listing_id) \
                        .single() \
                        .execute()
                    old_price = old_response.data.get('price_numeric') if old_response.data else None
                except:
                    pass
                
                # Transform listing data (includes new fields)
                update_data = self._transform_listing_data(listing)
                
                # Remove fields that shouldn't be updated
                update_data.pop('external_id', None)
                update_data.pop('source', None)
                update_data.pop('is_active', None)
                update_data.pop('scraped_at', None)
                
                # Update last_updated
                update_data['last_updated'] = datetime.now().isoformat()
                
                response = self.supabase.table(table_name) \
                    .update(update_data) \
                    .eq('id', listing_id) \
                    .execute()
                
                if response.data:
                    updated_count += 1
                    
                    # Save price history if price changed
                    new_price = listing.get('price_numeric')
                    if old_price and new_price and old_price != new_price:
                        self._save_price_history(listing_id, old_price, new_price)
            
            return updated_count
            
        except Exception as e:
            print(f"  ❌ Error updating listings: {str(e)}")
            return 0
    
    def _save_price_history(self, listing_id: int, old_price: float, new_price: float):
        """Save price change to history table"""
        try:
            self.supabase.table('price_history').insert({
                'listing_id': listing_id,
                'old_price': old_price,
                'new_price': new_price,
                'changed_at': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"  ⚠️  Warning: Could not save price history: {str(e)}")
    
    def _mark_expired_listings(self, days: int = 7) -> int:
        """Mark listings as inactive if not scraped recently"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            total_marked = 0
            
            # Mark expired listings in each source table
            for table_name in SOURCE_TABLES.values():
                try:
                    response = self.supabase.table(table_name) \
                        .update({
                            'is_active': False,
                        }) \
                        .eq('is_active', True) \
                        .lt('scraped_at', cutoff_date) \
                        .execute()
                    
                    total_marked += len(response.data) if response.data else 0
                except Exception as e:
                    print(f"  ⚠️  Warning: Could not mark expired listings in {table_name}: {str(e)}")
            
            return total_marked
            
        except Exception as e:
            print(f"  ⚠️  Warning: Could not mark expired listings: {str(e)}")
            return 0
    
    def _log_sync(self, stats: Dict):
        """Log sync operation to database"""
        try:
            self.supabase.table('sync_logs').insert({
                'started_at': stats['started_at'].isoformat(),
                'finished_at': stats['finished_at'].isoformat(),
                'duration_seconds': stats['duration_seconds'],
                'sources_synced': stats['sources_synced'],
                'total_scraped': stats['total_scraped'],
                'total_inserted': stats['total_inserted'],
                'total_updated': stats['total_updated'],
                'total_errors': stats['total_errors'],
                'success': stats['total_errors'] == 0
            }).execute()
        except Exception as e:
            print(f"  ⚠️  Warning: Could not log sync: {str(e)}")
    
    def incremental_sync(self, pages: int = 5) -> Dict:
        """
        Quick incremental sync (only first few pages)
        
        Args:
            pages: Number of pages to scrape (default: 5)
        """
        print(f"\n🔄 Running INCREMENTAL SYNC (first {pages} pages)")
        return self.sync_all_sources(max_pages=pages)


class SyncScheduler:
    """Handles scheduled syncing"""
    
    def __init__(self, sync_service: SupabaseSyncService,
                 full_sync_hours: int = 24,
                 incremental_sync_hours: int = 1):
        """
        Initialize scheduler
        
        Args:
            sync_service: SupabaseSyncService instance
            full_sync_hours: Hours between full syncs
            incremental_sync_hours: Hours between incremental syncs
        """
        self.sync_service = sync_service
        self.full_sync_interval = full_sync_hours * 3600
        self.incremental_sync_interval = incremental_sync_hours * 3600
        self.last_full_sync = 0
        self.last_incremental_sync = 0
    
    def run_forever(self):
        """Run scheduled syncs forever"""
        print("\n🚀 Scheduler started")
        print(f"Full sync every {self.full_sync_interval/3600:.1f} hours")
        print(f"Incremental sync every {self.incremental_sync_interval/3600:.1f} hours")
        print("Press Ctrl+C to stop\n")
        
        try:
            while True:
                current_time = time.time()
                
                # Check if full sync is due
                if current_time - self.last_full_sync >= self.full_sync_interval:
                    self.sync_service.sync_all_sources(max_pages=10)
                    self.last_full_sync = current_time
                    self.last_incremental_sync = current_time  # Reset incremental timer
                
                # Check if incremental sync is due
                elif current_time - self.last_incremental_sync >= self.incremental_sync_interval:
                    self.sync_service.incremental_sync(pages=5)
                    self.last_incremental_sync = current_time
                
                # Sleep for 1 minute before checking again
                time.sleep(60)
                
        except KeyboardInterrupt:
            print("\n\n⏹️  Scheduler stopped by user")


def main():
    parser = argparse.ArgumentParser(description='Property Sync Service - Supabase')
    parser.add_argument('--mode', choices=['once', 'schedule', 'incremental'],
                       default='once',
                       help='Sync mode: once (single run), schedule (continuous), incremental (quick update)')
    parser.add_argument('--pages', type=int, default=10,
                       help='Maximum pages to scrape (default: 10 for full, 5 for incremental)')
    
    args = parser.parse_args()
    
    try:
        # Initialize service
        print("🔌 Connecting to Supabase...")
        service = SupabaseSyncService()
        print("✅ Connected to Supabase\n")
        
        if args.mode == 'once':
            # Single sync
            service.sync_all_sources(max_pages=args.pages)
        
        elif args.mode == 'incremental':
            # Quick incremental sync
            service.incremental_sync(pages=args.pages)
        
        elif args.mode == 'schedule':
            # Continuous scheduled syncing
            scheduler = SyncScheduler(service)
            scheduler.run_forever()
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopped by user")
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
