/**
 * Core type definitions for property listings
 * Add new sources by extending the DataSource type
 */

export type DataSource = 'olx' | 'nekretnine' | 'all'

export interface Listing {
  id: number
  external_id: string
  url: string
  title: string | null
  description?: string | null
  price_numeric: number | null
  price_per_m2?: number | null
  municipality?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  property_type?: string | null
  ad_type?: string | null
  rooms?: number | null
  square_m2?: number | null
  bathrooms?: number | null
  condition?: string | null
  equipment?: string | null
  level?: string | number | null
  level_numeric?: number | null
  heating?: string | null
  orientation?: string | null
  floor_type?: string | null
  year_built?: string | number | null
  has_garage?: boolean | null
  has_internet?: boolean | null
  has_cable_tv?: boolean | null
  has_elevator?: boolean | null
  has_balcony?: boolean | null
  has_basement?: boolean | null
  has_parking?: boolean | null
  thumbnail_url?: string | null
  image_urls?: string[] | null
  predicted_price?: number | null
  price_difference?: number | null
  deal_score?: number | null
  is_underpriced?: boolean | null
  is_overpriced?: boolean | null
  publication_date?: string | null
  posted_date?: string | null
  scraped_at?: string | null
  last_updated?: string | null
  is_active?: boolean | null
  expired_at?: string | null
  extra_fields?: Record<string, any> | null
  seller_name?: string | null
  seller_type?: string | null
  seller_phone?: string | null
  source: Exclude<DataSource, 'all'>
}

export interface ListingFilters {
  source: DataSource
  search: string
  priceMin: string
  priceMax: string
  municipality: string
  adType: string
  roomsMin: string
  roomsMax: string
  sizeMin: string
  sizeMax: string
  condition: string
  dealScoreMin: string
}

export interface FilterOptions {
  municipalities: string[]
  property_types: string[]
  ad_types: string[]
  price_range: { min: number; max: number; step: number }
  rooms_range: { min: number; max: number; step: number }
  size_range: { min: number; max: number; step: number }
}

export interface ListingsParams {
  limit?: number
  offset?: number
  source?: DataSource
  search?: string
  municipality?: string
  property_type?: string
  ad_type?: string
  price_min?: number
  price_max?: number
  rooms_min?: number
  rooms_max?: number
  size_min?: number
  size_max?: number
  deal_score_min?: number
}

export interface ListingsResponse {
  success: boolean
  data: Listing[]
  count: number
  total: number
  offset: number
  limit: number
}

export interface StatisticsSummary {
  total_listings: number
  olx_listings: number
  nekretnine_listings: number
  price_stats: {
    min: number
    max: number
    avg: number
  }
}

export interface MunicipalityStats {
  municipality: string
  total_listings: number
  avg_price: number
  avg_price_per_m2: number
  avg_rooms: number
  avg_size: number
}

export interface FavoriteItem {
  id: number
  user_id: string
  source: Exclude<DataSource, 'all'>
  listing_id: number
  notes?: string
  created_at: string
  listing?: Listing
}
