/**
 * Reusable Listing Card Component
 * Displays property listing with consistent design
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Listing } from "@/types/listing.types";
import { SourceBadge } from "./SourceBadge";
import {
  formatPrice,
  formatPriceEur,
  formatRooms,
  formatSquareMeters,
  getDealScoreColor,
  getDealScoreLabel,
} from "@/utils/formatting.utils";

interface ListingCardProps {
  listing: Listing;
  index?: number;
  onPress?: (listing: Listing) => void;
  onToggleFavorite?: (listing: Listing) => void;
  isFavorite?: boolean;
  showSource?: boolean;
  compact?: boolean;
}

const ListingCardComponent: React.FC<ListingCardProps> = ({
  listing,
  index = 0,
  onPress,
  onToggleFavorite,
  isFavorite = false,
  showSource = true,
  compact = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const dealScore = Number(listing.deal_score ?? 0) || 0;
  const dealColor = getDealScoreColor(dealScore);
  const dealLabel = getDealScoreLabel(dealScore);

  // Get thumbnail image
  const thumbnailUrl = listing.thumbnail_url || listing.image_urls?.[0] || null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(listing);
    } else if (listing.url) {
      Linking.openURL(listing.url);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleFavorite?.(listing);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: index * 50 }}
    >
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Property listing: ${listing.title}`}
        accessibilityRole="button"
      >
        {/* Thumbnail Image */}
        {thumbnailUrl && !imageError ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={[styles.thumbnail, compact && styles.thumbnailCompact]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.thumbnail, styles.noImage, compact && styles.thumbnailCompact]}>
            <Ionicons name="image-outline" size={compact ? 24 : 32} color="#ccc" />
          </View>
        )}

        {/* Source Badge - Top Right Corner (Over Image) */}
        {showSource && listing.source ? (
          <View style={styles.sourceBadgeOverlay}>
            <SourceBadge source={listing.source} size="small" />
          </View>
        ) : null}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <View style={styles.favoriteButtonBg}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#ef4444" : "#fff"}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Compact Card Header - Price & Deal Score */}
        <View style={styles.cardHeader}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, compact && styles.priceCompact]}>
              {formatPrice(listing.price_numeric)}
            </Text>
            {!compact && listing.predicted_price ? (
              <Text style={styles.priceEur}>
                Predicted: {formatPrice(listing.predicted_price)}
              </Text>
            ) : null}
          </View>
          
          {/* Deal Score Badge */}
          <View style={[styles.dealBadge, { backgroundColor: dealColor + '20' }]}>
            <Ionicons
              name={
                dealScore >= 90
                  ? "star"
                  : dealScore >= 70
                  ? "star-half"
                  : "star-outline"
              }
              size={14}
              color={dealColor}
            />
            <Text style={[styles.dealScoreText, { color: dealColor }]}>
              {Math.round(dealScore)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
          {listing.title || "No title available"}
        </Text>

        {/* Key Details Grid */}
        <View style={styles.keyDetailsGrid}>
          {listing.rooms ? (
            <View style={styles.keyDetailItem}>
              <Ionicons name="bed" size={18} color="#667eea" />
              <Text style={styles.keyDetailText}>{formatRooms(listing.rooms)}</Text>
            </View>
          ) : null}
          
          {listing.square_m2 ? (
            <View style={styles.keyDetailItem}>
              <Ionicons name="resize" size={18} color="#667eea" />
              <Text style={styles.keyDetailText}>{formatSquareMeters(listing.square_m2)}</Text>
            </View>
          ) : null}
          
          {listing.level != null ? (
            <View style={styles.keyDetailItem}>
              <Ionicons name="layers" size={18} color="#667eea" />
              <Text style={styles.keyDetailText}>Floor {listing.level}</Text>
            </View>
          ) : null}
          
          {listing.square_m2 && listing.price_numeric ? (
            <View style={styles.keyDetailItem}>
              <Ionicons name="calculator" size={18} color="#667eea" />
              <Text style={styles.keyDetailText}>
                {Math.round(listing.price_numeric / listing.square_m2)} KM/m²
              </Text>
            </View>
          ) : null}
        </View>

        {/* Details */}
        <View style={styles.details}>
          {listing.municipality ? (
            <DetailRow icon="location" text={listing.municipality} />
          ) : null}
          
          {listing.property_type ? (
            <DetailRow icon="home" text={listing.property_type} />
          ) : null}
          
          {!compact && (listing.condition || listing.heating) ? (
            <DetailRow
              icon="information-circle"
              text={[listing.condition, listing.heating]
                .filter(Boolean)
                .join(" • ")}
            />
          ) : null}
          
          {/* Amenities Row - Only show if any exist */}
          {!compact && (listing.has_elevator ||
            listing.has_balcony ||
            listing.has_parking ||
            listing.has_garage) ? (
            <View style={styles.amenitiesRow}>
              {listing.has_elevator ? (
                <AmenityBadge icon="arrow-up" label="Lift" />
              ) : null}
              {listing.has_balcony ? (
                <AmenityBadge icon="partly-sunny" label="Balcony" />
              ) : null}
              {listing.has_parking ? (
                <AmenityBadge icon="car" label="Parking" />
              ) : null}
              {listing.has_garage ? (
                <AmenityBadge icon="home" label="Garage" />
              ) : null}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ListingCard = React.memo(ListingCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.compact === nextProps.compact &&
    prevProps.showSource === nextProps.showSource
  );
});

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#667eea" />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

interface AmenityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const AmenityBadge: React.FC<AmenityBadgeProps> = ({ icon, label }) => (
  <View style={styles.amenityBadge}>
    <Ionicons name={icon} size={14} color="#667eea" />
    <Text style={styles.amenityText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  sourceBadgeOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteButtonBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  priceEur: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  dealBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  dealScoreText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginHorizontal: 16,
    lineHeight: 20,
  },
  keyDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  keyDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e8ebff",
  },
  keyDetailText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  details: {
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  amenityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#667eea33",
  },
  amenityText: {
    fontSize: 11,
    color: "#667eea",
    fontWeight: "600",
  },
  // Compact mode styles
  cardCompact: {
    marginBottom: 8,
  },
  thumbnailCompact: {
    height: 120,
  },
  priceCompact: {
    fontSize: 18,
    fontWeight: "bold",
  },
  titleCompact: {
    fontSize: 13,
    marginHorizontal: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
});
