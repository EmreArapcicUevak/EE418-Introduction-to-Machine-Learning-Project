/**
 * Favorites Service
 * Handles API calls for saving/unsaving listings
 */

import { DataSource, Listing } from '@/types/listing.types'
import { supabase } from './supabase'
import { API_URL } from '@/constants/config'

export interface FavoriteStatus {
  isFavorite: boolean
  favoriteId?: string
}

/**
 * Get authorization header with current session token
 */
const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? `Bearer ${session.access_token}` : ''
}

/**
 * Add a listing to favorites
 */
export const addFavorite = async (
  listingId: string,
  source: DataSource
): Promise<{ success: boolean; favoriteId?: string; error?: string }> => {
  try {
    const authToken = await getAuthHeader()
    
    const response = await fetch(`${API_URL}/api/v2/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        listing_id: parseInt(listingId, 10),
        source
      })
    })

    if (!response.ok) {
      const text = await response.text()
      let errorMessage = 'Failed to add favorite'
      try {
        const data = JSON.parse(text)
        errorMessage = data.detail || data.error || errorMessage
      } catch {
        errorMessage = text.substring(0, 100)
      }
      console.error('Add favorite failed:', response.status, errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error adding favorite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Remove a listing from favorites
 */
export const removeFavorite = async (
  listingId: string,
  source: DataSource
): Promise<{ success: boolean; error?: string }> => {
  try {
    const authToken = await getAuthHeader()
    
    const response = await fetch(`${API_URL}/api/v2/favorites`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        listing_id: parseInt(listingId, 10),
        source
      })
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || 'Failed to remove favorite'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error removing favorite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all favorite listings
 */
export const getFavorites = async (): Promise<{
  success: boolean
  favorites?: Listing[]
  error?: string
}> => {
  try {
    const authToken = await getAuthHeader()
    
    const response = await fetch(`${API_URL}/api/v2/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || 'Failed to get favorites'
      }
    }

    const data = await response.json()

    return {
      success: true,
      favorites: data.data || []  // API returns {success, data, count}
    }
  } catch (error) {
    console.error('Error getting favorites:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a listing is favorited
 */
export const checkFavoriteStatus = async (
  listingId: string,
  source: DataSource
): Promise<FavoriteStatus> => {
  try {
    const result = await getFavorites()

    if (!result.success || !result.favorites) {
      return { isFavorite: false }
    }

    const favorite = result.favorites.find(
      (fav) => fav.id.toString() === listingId && fav.source === source
    )

    return {
      isFavorite: !!favorite,
      favoriteId: favorite?.id.toString()
    }
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return { isFavorite: false }
  }
}

/**
 * Toggle favorite status (add if not favorite, remove if favorite)
 */
export const toggleFavorite = async (
  listingId: string,
  source: DataSource,
  currentStatus: boolean
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> => {
  if (currentStatus) {
    const result = await removeFavorite(listingId, source)
    return {
      success: result.success,
      isFavorite: false,
      error: result.error
    }
  } else {
    const result = await addFavorite(listingId, source)
    return {
      success: result.success,
      isFavorite: true,
      error: result.error
    }
  }
}
