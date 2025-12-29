"""
OLX Bosnia Real Estate Scraper
Scrapes apartment listings from OLX.ba using Selenium + BeautifulSoup
Based on the proven scraping method from the Jupyter notebook
"""

import os
import time
import re
import random
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import WebDriverException, TimeoutException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OLXScraper:
    """Scraper for OLX.ba property listings using Selenium"""
    
    BASE_URL = "https://olx.ba/pretraga?attr=&attr_encoded=1&q=stanovi&category_id=23&page={}&canton=9"
    DETAIL_BASE = "https://olx.ba"
    
    def __init__(self, 
                 delay: tuple = (2, 5),
                 firefox_binary: str = "/usr/bin/firefox",
                 geckodriver_path: str = None):
        """
        Initialize OLX scraper with Selenium
        
        Args:
            delay: Tuple of (min, max) seconds delay between requests
            firefox_binary: Path to Firefox binary
            geckodriver_path: Path to geckodriver (auto-detect if None)
        """
        self.delay = delay
        self.firefox_binary = firefox_binary
        self.geckodriver_path = geckodriver_path or self._find_geckodriver()
        self.driver = None
    
    def _find_geckodriver(self) -> str:
        """Auto-detect geckodriver path"""
        common_paths = [
            "/usr/bin/geckodriver",
            "/usr/local/bin/geckodriver",
            os.path.expanduser("~/miniforge3/bin/geckodriver"),
            os.path.expanduser("~/.local/bin/geckodriver"),
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        # Try to find in PATH
        import shutil
        geckodriver = shutil.which("geckodriver")
        if geckodriver:
            return geckodriver
        
        raise FileNotFoundError(
            "Geckodriver not found. Install with: sudo apt install firefox-geckodriver"
        )
    
    def _init_driver(self):
        """Initialize Selenium WebDriver with improved bot detection avoidance"""
        if self.driver:
            return
        
        logger.info("Initializing Firefox WebDriver...")
        options = Options()
        options.binary_location = self.firefox_binary
        
        # Enable headless mode for overnight scraping
        options.add_argument("--headless")
        
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--window-size=1920,1080")
        
        # More realistic user agent
        options.set_preference("general.useragent.override", 
            "Mozilla/5.0 (X11; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0")
        
        # Enable JavaScript and images
        options.set_preference("javascript.enabled", True)
        options.set_preference("permissions.default.image", 2)  # Disable images for speed
        
        service = Service(executable_path=self.geckodriver_path)
        self.driver = webdriver.Firefox(service=service, options=options)
        self.driver.set_page_load_timeout(120)
        
        # Hide webdriver property
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        logger.info("✅ WebDriver initialized")
    
    def _close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            logger.info("WebDriver closed")
    
    @staticmethod
    def clean_text(s: str) -> Optional[str]:
        """Clean text by removing extra whitespace"""
        return " ".join(s.split()).strip() if s else None
    
    @staticmethod
    def extract_price(text: str) -> Optional[int]:
        """Extract numeric price from text (e.g. '250,000 KM' -> 250000)"""
        if not text:
            return None
        cleaned = re.sub(r"[^0-9]", "", text)
        return int(cleaned) if cleaned else None
    
    @staticmethod
    def extract_number(text: str) -> Optional[int]:
        """Extract first number from text"""
        if not text:
            return None
        m = re.search(r"(\d+)", text)
        return int(m.group(1)) if m else None
    
    @staticmethod
    def extract_float(text: str) -> Optional[float]:
        """Extract float from text (e.g. '65,5 m²' -> 65.5)"""
        if not text:
            return None
        try:
            # Replace comma with dot for float conversion
            text_clean = re.sub(r"[^\d,.]", "", text).replace(",", ".")
            return float(text_clean) if text_clean else None
        except ValueError:
            return None
    
    @staticmethod
    def extract_coordinates(soup: BeautifulSoup) -> Tuple[Optional[float], Optional[float]]:
        """
        Extract latitude and longitude from Google Maps embed
        
        Returns:
            Tuple of (latitude, longitude) or (None, None)
        """
        try:
            # Method 1: Look for Google Maps links with ll parameter
            links = soup.find_all("a", href=re.compile(r"google\.com/maps"))
            for link in links:
                href = link.get("href", "")
                # Extract from ll parameter: ll=43.713458,18.285125
                ll_match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if ll_match:
                    return float(ll_match.group(1)), float(ll_match.group(2))
                
                # Extract from @coordinates: @43.713458,18.285125
                at_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if at_match:
                    return float(at_match.group(1)), float(at_match.group(2))
            
            # Method 2: Look for Google Maps iframe
            iframe = soup.find("iframe", src=re.compile(r"google\.com/maps"))
            if iframe:
                src = iframe.get("src", "")
                ll_match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if ll_match:
                    return float(ll_match.group(1)), float(ll_match.group(2))
            
            # Method 3: Look in script tags
            scripts = soup.find_all("script")
            for script in scripts:
                if script.string:
                    coord_match = re.search(r'(?:lat|latitude)["\s:]+(-?\d+\.\d+).*?(?:lng|longitude)["\s:]+(-?\d+\.\d+)', script.string, re.IGNORECASE)
                    if coord_match:
                        return float(coord_match.group(1)), float(coord_match.group(2))
            
            return None, None
        except Exception as e:
            logger.warning(f"Failed to extract coordinates: {e}")
            return None, None
    
    @staticmethod
    def extract_property_details_flexible(soup: BeautifulSoup) -> Dict[str, any]:
        """
        Flexible extraction of property details from tbody div structure
        Extracts both text values and boolean amenities
        
        Returns:
            Dictionary of field name -> value (str or bool)
        """
        details = {}
        try:
            # Find all rows in the tbody div  
            rows = soup.select("div.tbody div.grid")
            for row in rows:
                # Get all h4 elements (label and value)
                h4_elements = row.find_all("h4")
                if len(h4_elements) >= 2:
                    # Text value field
                    label = h4_elements[0].get_text(strip=True)
                    value = h4_elements[1].get_text(strip=True)
                    
                    # Normalize label to snake_case
                    label_key = re.sub(r'\s+', '_', label.lower())
                    label_key = re.sub(r'[^a-z0-9_]', '', label_key)
                    details[label_key] = value
                elif len(h4_elements) == 1:
                    # Boolean field (has checkmark SVG or not)
                    label = h4_elements[0].get_text(strip=True)
                    has_checkmark = row.find("svg", {"data-testid": "input-success-suffix"}) is not None
                    
                    label_key = re.sub(r'\s+', '_', label.lower())
                    label_key = re.sub(r'[^a-z0-9_]', '', label_key)
                    details[label_key] = has_checkmark
        
        except Exception as e:
            logger.warning(f"Failed flexible extraction: {e}")
        
        return details
    
    def fetch_page_source(self, url: str) -> Optional[str]:
        """Load page and return HTML source with timeout protection"""
        try:
            # Set a page load timeout
            self.driver.set_page_load_timeout(30)
            self.driver.get(url)
            
            # Wait for Vue.js app to initialize and render content
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.by import By
            
            try:
                # Wait for Vue app to mount - look for specific content that appears after JS loads
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h1[class*='heading'], .price-heading"))
                )
                logger.debug("Main content loaded")
                
                # Additional wait for description to load (it may load after the title)
                time.sleep(2)
                
                # Try to wait for description specifically (but don't fail if not found)
                try:
                    WebDriverWait(self.driver, 3).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".ad-description, [class*='description']"))
                    )
                    logger.debug("Description loaded")
                except TimeoutException:
                    logger.debug("Description element not found within timeout")
                    
            except TimeoutException:
                logger.warning("Timeout waiting for main content to load - continuing anyway")
            
            return self.driver.page_source
            
        except TimeoutException:
            logger.warning(f"Page load timeout for {url} - skipping")
            return None
        except (WebDriverException, OSError) as e:
            logger.warning(f"Failed to load page: {url} → {str(e)[:80]}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error loading page: {url} → {e}")
            return None
        
    
    def parse_detail_page(self, url: str) -> Optional[Dict]:
        """
        Parse detailed information from a single listing page
        
        Args:
            url: URL of the listing detail page
            
        Returns:
            Dictionary with listing details
        """
        logger.info(f"🔍 Parsing: {url}")
        
        html = self.fetch_page_source(url)
        if not html:
            logger.warning(f"   ❌ No HTML returned")
            return None
        
        try:
            soup = BeautifulSoup(html, "lxml")
            get_text = lambda sel: self.clean_text(
                soup.select_one(sel).get_text()
            ) if soup.select_one(sel) else None
            
            # Extract title
            title = get_text("h1") or get_text(".main-title-listing")
            logger.info(f"   📝 Title: {title}")
            
            # Extract price
            price_text = get_text(".price-heading")
            price_numeric = self.extract_price(price_text)
            logger.info(f"   💰 Price: {price_text} → {price_numeric} KM")
            
            # Extract municipality (location)
            municipality_tag = soup.find("div", class_="btn-pill city")
            if municipality_tag:
                # Remove SVG icons
                for svg in municipality_tag.find_all("svg"):
                    svg.decompose()
                municipality = self.clean_text(municipality_tag.get_text())
            else:
                municipality = None
            logger.info(f"   📍 Municipality: {municipality}")
            
            # Extract coordinates from Google Maps
            latitude, longitude = self.extract_coordinates(soup)
            if latitude and longitude:
                logger.info(f"   🗺️  Coordinates: {latitude}, {longitude}")
            
            # Extract flexible property details from tbody structure
            flexible_details = self.extract_property_details_flexible(soup)
            
            # Extract property details using CSS selectors (existing method)
            rooms_text = get_text("div.required-wrap:nth-child(5) > div:nth-child(2) > h4:nth-child(2)")
            rooms = self.extract_number(rooms_text)
            logger.info(f"   🚪 Rooms: {rooms_text} → {rooms}")
            
            square_m2_text = get_text("div.required-wrap:nth-child(6) > div:nth-child(2) > h4:nth-child(2)")
            square_m2 = self.extract_float(square_m2_text)
            logger.info(f"   📏 Size: {square_m2_text} → {square_m2} m²")
            
            condition = get_text("div.required-wrap:nth-child(2) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏗️  Condition: {condition}")
            
            ad_type = get_text("div.required-wrap:nth-child(3) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   📋 Ad Type: {ad_type}")
            
            property_type = get_text("div.required-wrap:nth-child(4) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏠 Property Type: {property_type}")
            
            equipment = get_text("div.required-wrap:nth-child(7) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🛋️  Equipment: {equipment}")
            
            level = get_text("div.required-wrap:nth-child(8) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏢 Level: {level}")
            
            heating = get_text("div.required-wrap:nth-child(9) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🔥 Heating: {heating}")
            
            # Extract description
            description = None
            
            # Method 1: Try .ad-description directly
            description_container = soup.select_one(".ad-description-container")
            if description_container:
                # Get all text from description, preserving structure
                description_parts = []
                for element in description_container.find_all(['p']):
                    text = self.clean_text(element.get_text())
                    if text and len(text) > 1:  # Skip empty or single char
                        description_parts.append(text)
                
                if description_parts:
                    description = " ".join(description_parts)
            
            # Method 2: Try .ad-description-container
            if not description:
                desc_container = soup.select_one("div[class*='ad-description-container']")
                if desc_container:
                    # Remove button elements
                    for button in desc_container.find_all('button'):
                        button.decompose()
                    description = self.clean_text(desc_container.get_text())
            
            # Method 3: Try data-v-66c319e2 attribute (Vue.js component)
            if not description:
                vue_desc = soup.find('div', attrs={'data-v-66c319e2': True})
                if vue_desc:
                    desc_div = vue_desc.find('div', class_='ad-description')
                    if desc_div:
                        description_parts = []
                        for p in desc_div.find_all('p'):
                            text = self.clean_text(p.get_text())
                            if text and len(text) > 1:
                                description_parts.append(text)
                        if description_parts:
                            description = " ".join(description_parts)
            
            if description:
                logger.info(f"   📄 Description: {description[:100]}... ({len(description)} chars)")
            else:
                logger.info(f"   📄 Description: Not found")
                # Debug: Show what we did find
                all_divs = soup.find_all('div', class_=re.compile('description'))
                if all_divs:
                    logger.debug(f"   Found {len(all_divs)} divs with 'description' in class name")
                    for div in all_divs[:3]:
                        logger.debug(f"     - {div.get('class')}: {str(div)[:100]}...")
            
            # Extract external ID from URL
            url_match = re.search(r'/artikal/(\d+)', url)
            external_id = f"olx_{url_match.group(1)}" if url_match else f"olx_{hash(url) % 10000000}"
            logger.info(f"   🆔 External ID: {external_id}")
            
            # Extract all images from swiper carousel
            image_urls = []
            # Find all swiper slides with images (excluding duplicates)
            swiper_imgs = soup.select("div.swiper-slide:not(.swiper-slide-duplicate) img")
            for img in swiper_imgs:
                img_url = img.get("src") or img.get("data-src")
                if img_url and img_url not in image_urls:
                    image_urls.append(img_url)
            
            # Fallback to article-img if no swiper images found
            if not image_urls:
                img = soup.select_one("img.article-img")
                if img:
                    img_url = img.get("src") or img.get("data-src")
                    if img_url:
                        image_urls.append(img_url)
            
            thumbnail_url = image_urls[0] if image_urls else None
            logger.info(f"   🖼️  Images: {len(image_urls)} found")
            if image_urls:
                logger.info(f"      First: {image_urls[0][:60]}...")
                logger.info(f"      Total URLs: {image_urls}")
            
            # Build listing dictionary with database column mapping
            details = {
                "external_id": external_id,
                "url": url,
                "title": title,
                "description": description,
                "price_numeric": price_numeric,
                "municipality": municipality,
                "condition": condition,
                "ad_type": ad_type,
                "property_type": property_type,
                "rooms": rooms,
                "square_m2": square_m2,
                "equipment": equipment,
                "level": level,
                "heating": heating,
                "thumbnail_url": thumbnail_url,
                "image_urls": image_urls,
                "latitude": latitude,
                "longitude": longitude,
                "posted_date": datetime.now().isoformat(),
                "scraped_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "is_active": True,
            }
            
            # Helper function to parse OLX date format (DD.MM.YYYY)
            def parse_olx_date(date_str: str) -> Optional[str]:
                """Convert DD.MM.YYYY to ISO format YYYY-MM-DD"""
                try:
                    parts = date_str.split('.')
                    if len(parts) == 3:
                        day, month, year = parts
                        # Create datetime and return ISO format date only
                        dt = datetime(int(year), int(month), int(day))
                        return dt.date().isoformat()
                except:
                    pass
                return None
            
            # Map flexible_details to database columns
            field_mapping = {
                "adresa": "address",
                "broj_kupatila": "bathrooms",
                "primarna_orjentacija": "orientation",
                "vrsta_poda": "floor_type",
                "godina_izgradnje": "year_built",
                "garaža": "has_garage",
                "internet": "has_internet",
                "kablovska_tv": "has_cable_tv",
                "lift": "has_elevator",
                "balkon": "has_balcony",
                "podrum_tavan": "has_basement",
                "parking": "has_parking",
            }
            
            # Log and map fields
            for olx_field, db_column in field_mapping.items():
                if olx_field in flexible_details:
                    value = flexible_details[olx_field]
                    details[db_column] = value
                    logger.info(f"   🔍 {olx_field} → {db_column}: {value}")
            
            # Handle publication_date separately (needs date parsing)
            if "datum_objave" in flexible_details:
                date_str = flexible_details["datum_objave"]
                parsed_date = parse_olx_date(date_str)
                if parsed_date:
                    details["publication_date"] = parsed_date
                    logger.info(f"   🔍 datum_objave → publication_date: {date_str} → {parsed_date}")
                else:
                    logger.warning(f"   ⚠️  Could not parse date: {date_str}")
            
            # Store remaining unmapped fields in extra_fields JSON column
            extra_fields = {}
            for key, value in flexible_details.items():
                if key not in field_mapping:
                    extra_fields[key] = value
            
            if extra_fields:
                details["extra_fields"] = extra_fields
            
            logger.info(f"   ✅ Successfully parsed listing with {len(flexible_details)} extra fields")
            return details
            
        except Exception as e:
            logger.error(f"   ❌ Failed to parse details for {url} → {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def scrape_listings(self, 
                       canton: int = 9,  # 9 = Sarajevo Canton
                       max_pages: int = 10) -> List[Dict]:
        """
        Scrape apartment listings from OLX search results
        
        Args:
            canton: Canton ID (9 for Sarajevo)
            max_pages: Maximum number of pages to scrape
            
        Returns:
            List of listing dictionaries
        """
        self._init_driver()
        all_listings = []
        
        try:
            for page in range(1, max_pages + 1):
                logger.info(f"Scraping page {page}/{max_pages}")
                
                search_url = self.BASE_URL.format(page)
                html = self.fetch_page_source(search_url)
                
                if not html:
                    logger.warning(f"Skipping search page {page}")
                    continue
                
                try:
                    soup = BeautifulSoup(html, "lxml")
                    
                    # Find main listings section
                    main_section = soup.find("main", class_="articles")
                    if not main_section:
                        logger.warning(f"No listings section found on page {page}")
                        continue
                    
                    # Extract all listing links
                    links = [
                        urljoin(self.DETAIL_BASE, a["href"])
                        for a in main_section.find_all("a", href=True)
                        if "/artikal/" in a.get("href", "")
                    ]
                    
                    # Remove duplicates
                    links = list(dict.fromkeys(links))
                    
                    logger.info(f"📄 Page {page}: found {len(links)} listings")
                    
                    if not links:
                        logger.info("⚠️  No more listings found")
                        break
                    
                    # Parse each listing
                    for idx, link in enumerate(links, 1):
                        logger.info(f"\n{'='*80}")
                        logger.info(f"Listing {idx}/{len(links)} on page {page}")
                        logger.info(f"{'='*80}")
                        
                        try:
                            data = self.parse_detail_page(link)
                            if data:
                                all_listings.append(data)
                                logger.info(f"✅ Total scraped: {len(all_listings)}")
                            else:
                                logger.warning(f"⚠️  No data extracted")
                            
                            # Random delay to be respectful
                            delay_time = random.uniform(*self.delay)
                            logger.info(f"⏳ Waiting {delay_time:.1f}s...")
                            time.sleep(delay_time)
                            
                        except KeyboardInterrupt:
                            logger.info("\n⚠️  Scraping interrupted by user")
                            raise
                        except Exception as e:
                            logger.error(f"❌ Error on listing {link}: {str(e)[:100]}")
                            # Continue to next listing instead of crashing
                            continue
                    
                except Exception as e:
                    logger.error(f"Failed to parse search page {page} → {e}")
                    continue
            
            logger.info(f"Total listings scraped: {len(all_listings)}")
            return all_listings
            
        finally:
            self._close_driver()


if __name__ == "__main__":
    # Test the scraper
    print("🧪 Testing OLX Scraper...")
    print("="*60)
    
    scraper = OLXScraper(delay=(1, 2))
    
    try:
        listings = scraper.scrape_listings(max_pages=1)
        
        print(f"\n✅ Scraped {len(listings)} listings")
        
        if listings:
            print("\n📋 Sample listing:")
            sample = listings[0]
            for key, value in sample.items():
                if value is not None:
                    print(f"  {key}: {value}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
