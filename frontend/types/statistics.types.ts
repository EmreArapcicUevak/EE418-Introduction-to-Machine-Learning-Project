export interface StatisticsResponse {
  type: "sale" | "rent"
  count: number
  statistics: {
    price: {
      average: number
      median: number
      min: number
      max: number
    }
    size_m2: { average: number }
    price_per_m2: { average: number }
    rooms: { average: number }
    municipality: {
      most_common: string
      distribution: Record<string, number>
    }
    condition: {
      most_common: string
      distribution: Record<string, number>
    }
    heating: {
      most_common: string
      distribution: Record<string, number>
    }
    accessibility: Record<string, number>
  }
}

export interface MunicipalityStats {
  municipality: string
  total_count: number
  avg_price: number
  avg_size: number
  avg_deal_score: number
}

export interface SyncSource {
  source: string
  last_sync_at: string | null
  total_listings: number
  active_listings: number
}

export interface MapListing {
  id: number
  title: string
  price_numeric: number
  square_m2: number
  rooms: number
  municipality: string
  latitude: number
  longitude: number
  deal_score: number
  predicted_price: number
  price_difference: number
  source: string
  marker_color: string
  fairness: "good" | "fair" | "bad"
}
