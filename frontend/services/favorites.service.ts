import { DataSource, Listing } from "@/types/listing.types";
import { supabase } from "./supabase";
import { API_URL } from "@/constants/config";

export interface FavoriteStatus {
  isFavorite: boolean;
}
export interface Favorite extends Listing {
  is_favorite: true;
  saved_at: string; // ISO timestamp from backend
}

/**
 * Get authorization header with current session token
 */
const getAuthHeader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : "";
};

/**
 * Add a listing to favorites
 */
export const addFavorite = async (
  listingId: number,
  source: Exclude<DataSource, 'all'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const authToken = await getAuthHeader();

    const url =
      `${API_URL}/api/v2/favorites` +
      `?listing_id=${listingId}&source=${encodeURIComponent(source)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || "Failed to add favorite",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding favorite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Remove a listing from favorites
 */
export const removeFavorite = async (
  listingId: number,
  source: Exclude<DataSource, 'all'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const authToken = await getAuthHeader();

    const url =
      `${API_URL}/api/v2/favorites` +
      `?listing_id=${listingId}&source=${encodeURIComponent(source)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: authToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || "Failed to remove favorite",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing favorite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get all favorite listings
 */
export const getFavorites = async (): Promise<{
  success: boolean;
  favorites?: Favorite[];
  error?: string;
}> => {
  try {
    const authToken = await getAuthHeader();

    const response = await fetch(`${API_URL}/api/v2/favorites`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Failed to get favorites",
      };
    }

    return {
      success: true,
      favorites: data.data ?? [],
    };
  } catch (error) {
    console.error("Error getting favorites:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Check if a listing is favorited
 */
export const checkFavoriteStatus = async (
  listingId: number,
  source: Exclude<DataSource, 'all'>
): Promise<FavoriteStatus> => {
  try {
    const result = await getFavorites();

    if (!result.success || !result.favorites) {
      return { isFavorite: false };
    }

    const isFavorite = result.favorites.some(
      (fav) => fav.id === listingId && fav.source === source
    );

    return { isFavorite };
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return { isFavorite: false };
  }
};

/**
 * Toggle favorite status (add if not favorite, remove if favorite)
 */
export const toggleFavorite = async (
  listingId: string,
  source: Exclude<DataSource, 'all'>,
  currentStatus: boolean
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> => {
  if (currentStatus) {
    const result = await removeFavorite(parseInt(listingId, 10), source);
    return {
      success: result.success,
      isFavorite: false,
      error: result.error,
    };
  } else {
    const result = await addFavorite(parseInt(listingId, 10), source);
    return {
      success: result.success,
      isFavorite: true,
      error: result.error,
    };
  }
};
