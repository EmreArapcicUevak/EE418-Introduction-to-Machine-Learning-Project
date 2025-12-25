// ============================================
// MapMarkerPopup.tsx
// ============================================
import { View, Text, StyleSheet } from "react-native";
import { MapListing } from "@/types/statistics.types";

export const MapMarkerPopup = ({ item }: { item: MapListing }) => {
  const difference = item.price_numeric - item.predicted_price;
  const percentDiff = ((difference / item.predicted_price) * 100).toFixed(1);
  const isGoodDeal = difference < 0;

  return (
    <View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Listed Price</Text>
          <Text style={styles.priceValue}>
            {item.price_numeric.toLocaleString()} KM
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Predicted Price</Text>
          <Text style={[styles.priceValue, styles.predictedPrice]}>
            {Math.round(item.predicted_price).toLocaleString()} KM
          </Text>
        </View>
        <View style={styles.differenceRow}>
          <Text style={styles.differenceLabel}>Difference</Text>
          <Text style={[styles.differenceValue, isGoodDeal && styles.goodDeal]}>
            {isGoodDeal ? "" : "+"}
            {Math.abs(difference).toLocaleString()} KM ({percentDiff}%)
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Deal Score</Text>
          <Text style={styles.scoreValue}>{item.deal_score}/100</Text>
        </View>
        <View style={[styles.badge, badgeColor(item.fairness)]}>
          <Text style={styles.badgeText}>{item.fairness.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

const badgeColor = (fairness: string) => {
  const colors: Record<string, string> = {
    excellent: "#10b981",
    good: "#3b82f6",
    fair: "#f59e0b",
    poor: "#ef4444",
  };
  return { backgroundColor: colors[fairness] || "#64748b" };
};

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0f172a",
    lineHeight: 24,
  },
  priceSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  predictedPrice: {
    color: "#3b82f6",
  },
  differenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  differenceLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  differenceValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
  goodDeal: {
    color: "#10b981",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});