import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  usePredictionHistory,
} from "../../hooks/use-prediction-history";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPredictions } from "@/services/api";

export default function HistoryScreen() {
  const { history, clearHistory } = usePredictionHistory();
  const { user } = useAuth();
  const [serverHistory, setServerHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadServerHistory();
    }
  }, [user]);

  const loadServerHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserPredictions();
      setServerHistory(data);
    } catch (error) {
      console.error("Failed to load server history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Combine local and server history
  const combinedHistory = user ? serverHistory : history;

  const renderItem = ({ item }: { item: any }) => {
    // Handle both local and server predictions
    const price = item.price || item.predicted_price;
    const input = item.input || item;
    const createdAt = item.createdAt || item.created_at;
    
    const date = new Date(createdAt);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <LinearGradient colors={["#ffffff", "#f9fafb"]} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.price}>{price.toLocaleString()} KM</Text>
            <Text style={styles.priceEur}>
              ≈ €{(price / 2).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailsContainer}>
          <Text style={styles.detail}>
            📍 {input.latitude.toFixed(4)},{" "}
            {input.longitude.toFixed(4)}
          </Text>
          <Text style={styles.detail}>
            🏠 {input.square_m2} m² • {input.rooms} rooms • Floor{" "}
            {input.level}
          </Text>
          <Text style={styles.detail}>
            🏢 {input.property_type} • {input.condition}
          </Text>
          <Text style={styles.detail}>
            🛋️ {input.equipment} • 🔥 {input.heating}
          </Text>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
              {loading ? "Loading..." : `${combinedHistory.length} predictions`}
            </Text>
          </View>
          {combinedHistory.length > 0 && !user && (
            <Pressable onPress={clearHistory} style={styles.clearButton}>
              <Text style={styles.clearText}>🗑️ Clear All</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.emptySubtext}>Loading your predictions...</Text>
        </View>
      ) : combinedHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.empty}>No predictions yet</Text>
          <Text style={styles.emptySubtext}>
            {user 
              ? "Make your first prediction on the Predict tab!" 
              : "Sign in to sync your predictions across devices"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={combinedHistory}
          keyExtractor={(item, index) => item.id || `${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#e0e7ff",
    fontWeight: "500",
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  empty: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "900",
    color: "#667eea",
    marginBottom: 2,
  },
  priceEur: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  date: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 6,
  },
  detail: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
    lineHeight: 20,
  },
});
