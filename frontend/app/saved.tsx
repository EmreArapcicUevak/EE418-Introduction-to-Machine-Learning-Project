import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { Listing } from "@/types/listing.types";
import { ListingCard } from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";

export default function SavedListingsScreen() {
  const { favorites, loading, toggleFavorite, refresh, isFavorite } =
    useFavorites();

  const renderFavorite = ({
    item,
    index,
  }: {
    item: Listing;
    index: number;
  }) => {
    return (
      <View style={styles.favoriteContainer}>
        <ListingCard
          listing={item}
          index={index}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite(item)}
          showSource
          compact
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>My Favorites</Text>

            <View style={styles.placeholder} />
          </View>

          {!loading && (
            <Text style={styles.headerSubtitle}>
              {favorites.length} saved{" "}
              {favorites.length === 1 ? "property" : "properties"}
            </Text>
          )}
        </View>
      </BlurView>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your favorites…</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={64} color="#667eea" />
          <Text style={styles.emptyTitle}>No Saved Listings</Text>
          <Text style={styles.emptyText}>
            Browse properties and save your favorites.
            {"\n"}They’ll appear here for quick access.
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(tabs)/explore")}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.browseButtonGradient}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.browseButtonText}>Browse Listings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerContent: {
    gap: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  browseButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  browseButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingTop: 20,
  },
  favoriteContainer: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#fee",
  },
  removeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  savedDate: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
    fontWeight: "500",
  },
});
