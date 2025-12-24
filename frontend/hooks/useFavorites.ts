import { useState, useEffect, useCallback } from "react";
import { Alert, DeviceEventEmitter } from "react-native";
import * as Haptics from "expo-haptics";
import { Listing } from "@/types/listing.types";
import * as favoritesService from "@/services/favorites.service";



export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const makeKey = useCallback(
    (listing: Listing) => `${listing.id}-${listing.source || "olx"}`,
    []
  );

  const rebuildFavoriteIds = useCallback(
    (list: Listing[]) => new Set(list.map(makeKey)),
    [makeKey]
  );


  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await favoritesService.getFavorites();

      if (!result.success || !Array.isArray(result.favorites)) {
        throw new Error(result.error || "Failed to load favorites");
      }

      // Ensure source is present for keying
      const normalized = result.favorites.map(fav => ({
        ...fav,
        source: fav.source || "olx",
      }));

      setFavorites(normalized);
      setFavoriteIds(rebuildFavoriteIds(normalized));
    } catch (err) {
      console.error("Error loading favorites:", err);
      setFavorites([]);
      setFavoriteIds(new Set());
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [rebuildFavoriteIds]);
  
  const isFavorite = useCallback(
    (listing: Listing) => {
      return favoriteIds.has(makeKey(listing));
    },
    [favoriteIds, makeKey]
  );

  const toggleFavorite = useCallback(
    async (listing: Listing) => {
      const source = listing.source || "olx";
      const wasFavorite = favoriteIds.has(`${listing.id}-${source}`);
      const key = `${listing.id}-${source}`;

      // Optimistic update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (wasFavorite) {
        // Remove from state immediately
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setFavorites((prev) =>
          prev.filter(
            (fav) => !(fav.id === listing.id && (fav.source || "olx") === source)
          )
        );
      } else {
        // Add to state immediately
        setFavoriteIds((prev) => new Set(prev).add(key));
        setFavorites((prev) => [...prev, listing]);
      }

      // Make API call
      const result = await favoritesService.toggleFavorite(
        listing.id.toString(),
        source,
        wasFavorite
      );

      if (!result.success) {
        // Revert on error
        if (wasFavorite) {
          setFavoriteIds((prev) => new Set(prev).add(key));
          setFavorites((prev) => [...prev, { ...listing, source }]);
        } else {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setFavorites((prev) =>
            prev.filter(
              (fav) => !(fav.id === listing.id && (fav.source || "olx") === source)
            )
          );
        }

        Alert.alert(
          "Error",
          result.error || "Failed to update favorite status",
          [{ text: "OK" }]
        );
      } else {
        DeviceEventEmitter.emit("favorites-updated");
      }

      return result.success;
    },
    [favoriteIds]
  );


  const addFavorite = useCallback(
    async (listing: Listing) => {
      if (isFavorite(listing)) return true;

      // snapshot
      const prevFavorites = favorites;
      const prevIds = favoriteIds;

      // optimistic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextFavorites = [...favorites, listing];
      setFavorites(nextFavorites);
      setFavoriteIds(rebuildFavoriteIds(nextFavorites));

      const result = await favoritesService.addFavorite(
        listing.id,
        "olx"
      );

      if (!result.success) {
        // revert
        setFavorites(prevFavorites);
        setFavoriteIds(prevIds);

        Alert.alert(
          "Error",
          result.error || "Failed to add favorite",
          [{ text: "OK" }]
        );
      } else {
        DeviceEventEmitter.emit("favorites-updated");
      }

      return result.success;
    },
    [favorites, favoriteIds, isFavorite, rebuildFavoriteIds]
  );


  const removeFavorite = useCallback(
    async (listing: Listing) => {
      if (!isFavorite(listing)) return true;

      const prevFavorites = favorites;
      const prevIds = favoriteIds;

      // optimistic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextFavorites = favorites.filter(
        f => !(f.id === listing.id && f.source === listing.source)
      );
      setFavorites(nextFavorites);
      setFavoriteIds(rebuildFavoriteIds(nextFavorites));

      const result = await favoritesService.removeFavorite(
        listing.id,
        listing.source
      );

      if (!result.success) {
        // revert
        setFavorites(prevFavorites);
        setFavoriteIds(prevIds);

        Alert.alert(
          "Error",
          result.error || "Failed to remove favorite",
          [{ text: "OK" }]
        );
      } else {
        DeviceEventEmitter.emit("favorites-updated");
      }

      return result.success;
    },
    [favorites, favoriteIds, isFavorite, rebuildFavoriteIds]
  );


  useEffect(() => {
    loadFavorites();
    const sub = DeviceEventEmitter.addListener("favorites-updated", () => {
      loadFavorites();
    });
    return () => {
      sub.remove();
    };
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    refresh: loadFavorites,
    toggleFavorite
  };
};
