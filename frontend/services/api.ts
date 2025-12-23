import { API_URL } from '@/constants/config'
import { supabase } from './supabase'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// ===== Predictions =====

export async function makePrediction(data: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Prediction failed')
  }
  
  return response.json()
}

export async function getUserPredictions(limit = 50) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/predictions?limit=${limit}`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch predictions')
  }
  
  return response.json()
}

// ===== Enhanced Listings API v2 =====

export interface ListingsParams {
  source?: 'all' | 'olx' | 'nekretnine'
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
  limit?: number
  offset?: number
}

export async function getListingsV2(params: ListingsParams = {}) {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString())
    }
  })
  
  const response = await fetch(`${API_URL}/api/v2/listings?${queryParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch listings')
  }
  
  return response.json()
}

export async function getListingDetail(source: 'olx' | 'nekretnine', id: number) {
  const response = await fetch(`${API_URL}/api/v2/listings/${source}/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch listing detail')
  }
  
  return response.json()
}

export async function getSimilarListings(source: 'olx' | 'nekretnine', id: number, limit = 5) {
  const response = await fetch(`${API_URL}/api/v2/listings/similar/${source}/${id}?limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch similar listings')
  }
  
  return response.json()
}

// ===== Search & Discovery =====

export async function searchListings(query: string, limit = 20) {
  const response = await fetch(`${API_URL}/api/v2/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Search failed')
  }
  
  return response.json()
}

export async function getFilterOptions() {
  const response = await fetch(`${API_URL}/api/v2/filters/options`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch filter options')
  }
  
  return response.json()
}

// ===== Statistics & Analytics =====

export async function getStatisticsSummary() {
  const response = await fetch(`${API_URL}/api/v2/statistics/summary`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch statistics')
  }
  
  return response.json()
}

export async function getStatisticsByMunicipality() {
  const response = await fetch(`${API_URL}/api/v2/statistics/by-municipality`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch municipality statistics')
  }
  
  return response.json()
}

// ===== User Favorites =====

export async function addToFavorites(source: 'olx' | 'nekretnine', listingId: number, notes?: string) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/favorites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      source,
      listing_id: listingId,
      notes 
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to add to favorites')
  }
  
  return response.json()
}

export async function getFavorites() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/favorites`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch favorites')
  }
  
  return response.json()
}

export async function removeFromFavorites(source: 'olx' | 'nekretnine', listingId: number) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/favorites?source=${source}&listing_id=${listingId}`, {
    method: 'DELETE',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to remove from favorites')
  }
  
  return response.json()
}

export async function checkIfFavorited(source: 'olx' | 'nekretnine', listingId: number) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/favorites/check/${source}/${listingId}`, {
    headers
  })
  
  if (!response.ok) {
    return { is_favorited: false }
  }
  
  return response.json()
}

// ===== Saved Searches =====

export async function createSavedSearch(searchParams: any, name: string, notifyOnNew = false) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/saved-searches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      search_params: searchParams,
      name,
      notify_on_new: notifyOnNew
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to save search')
  }
  
  return response.json()
}

export async function getSavedSearches() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/saved-searches`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch saved searches')
  }
  
  return response.json()
}

export async function deleteSavedSearch(searchId: number) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/saved-searches/${searchId}`, {
    method: 'DELETE',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete saved search')
  }
  
  return response.json()
}

// ===== Notifications =====

export async function getNotifications(unreadOnly = false) {
  const headers = await getAuthHeaders()
  
  const url = unreadOnly 
    ? `${API_URL}/api/v2/notifications?unread=true`
    : `${API_URL}/api/v2/notifications`
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error('Failed to fetch notifications')
  }
  
  return response.json()
}

export async function markNotificationAsRead(notificationId: number) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/api/v2/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to mark notification as read')
  }
  
  return response.json()
}

// ===== Sync Status =====

export async function getSyncStatus() {
  const response = await fetch(`${API_URL}/api/v2/sync/status`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch sync status')
  }
  
  return response.json()
}

// ===== Health Check =====

export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/v2/health`)
  
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  
  return response.json()
}

// ===== Legacy Methods (for backward compatibility) =====

export async function getListings(limit = 100, sort = 'deal_score_desc') {
  // Map to v2 API
  return getListingsV2({ limit, source: 'all' })
}

export async function getRecommendedListings(limit = 50) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/listings/recommended?limit=${limit}`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations')
  }
  
  return response.json()
}

export async function getSavedListings() {
  // Map to v2 favorites API
  return getFavorites()
}

export async function saveListing(listingId: number, notes?: string) {
  // Assume 'olx' source for legacy support - you may need to adjust this
  return addToFavorites('olx', listingId, notes)
}

export async function removeSavedListing(listingId: number) {
  // Assume 'olx' source for legacy support
  return removeFromFavorites('olx', listingId)
}

export async function updateUserPreferences(preferences: any) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/profile/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(preferences)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update preferences')
  }
  
  return response.json()
}

export async function getUserPreferences() {
  const headers = await getAuthHeaders()
  
  const response = await fetch(`${API_URL}/profile/preferences`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch preferences')
  }
  
  return response.json()
}
