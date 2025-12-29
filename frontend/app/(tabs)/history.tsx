import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState, useMemo } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { usePredictionHistory } from "../../hooks/use-prediction-history"
import { useAuth } from "@/contexts/AuthContext"
import { getUserPredictions } from "@/services/api"

type NormalizedPrediction = {
  id: string
  price: number
  createdAt: string
  input: {
    latitude: number
    longitude: number
    square_m2: number
    rooms: number
    level: number
    property_type: string
    condition: string
    equipment: string
    heating: string
  }
}

export default function HistoryScreen() {
  const { history, clearHistory } = usePredictionHistory()
  const { user } = useAuth()

  const [serverHistory, setServerHistory] = useState<NormalizedPrediction[]>([])
  const [loading, setLoading] = useState(false)

  /* ------------------------- load server predictions ------------------------- */

  const loadServerHistory = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await getUserPredictions()

      const rows = Array.isArray(response.data) ? response.data : []

      const normalized = rows.map((row: any) => ({
        id: `server-${row.id}`,
        price: row.predicted_price,
        createdAt: row.created_at,
        input: {
          latitude: row.latitude,
          longitude: row.longitude,
          square_m2: row.square_m2,
          rooms: row.rooms,
          level: row.level,
          property_type: row.property_type,
          condition: row.condition,
          equipment: row.equipment,
          heating: row.heating,
        },
      }))

      setServerHistory(normalized)
    } catch (error) {
      console.error("Failed to load server history:", error)
      setServerHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadServerHistory()
    }
  }, [user])

  /* ------------------------- normalize local history ------------------------- */

  const localHistory: NormalizedPrediction[] = useMemo(() => {
    return history.map((item: any, index: number) => ({
      id: `local-${index}`,
      price: item.price,
      createdAt: item.createdAt,
      input: item.input,
    }))
  }, [history])

  const combinedHistory = user ? serverHistory : localHistory

  /* ------------------------------ render item ------------------------------- */

  const renderItem = ({ item }: { item: NormalizedPrediction }) => {
    const date = new Date(item.createdAt)
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    return (
      <LinearGradient colors={["#ffffff", "#f9fafb"]} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.price}>
              {item.price.toLocaleString()} KM
            </Text>
            <Text style={styles.priceEur}>
              ≈ €{Math.round(item.price / 2).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <Text style={styles.detail}>
            📍 {item.input.latitude.toFixed(4)},{" "}
            {item.input.longitude.toFixed(4)}
          </Text>
          <Text style={styles.detail}>
            🏠 {item.input.square_m2} m² • {item.input.rooms} rooms • Floor{" "}
            {item.input.level}
          </Text>
          <Text style={styles.detail}>
            🏢 {item.input.property_type} • {item.input.condition}
          </Text>
          <Text style={styles.detail}>
            🛋️ {item.input.equipment} • 🔥 {item.input.heating}
          </Text>
        </View>
      </LinearGradient>
    )
  }

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
              {loading
                ? "Loading..."
                : `${combinedHistory.length} predictions`}
            </Text>
          </View>

          {!user && combinedHistory.length > 0 && (
            <Pressable onPress={clearHistory} style={styles.clearButton}>
              <Text style={styles.clearText}>🗑️ Clear All</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.emptySubtext}>
            Loading your predictions...
          </Text>
        </View>
      ) : combinedHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.empty}>No predictions yet</Text>
          <Text style={styles.emptySubtext}>
            {user
              ? "Make your first prediction on the Predict tab!"
              : "Sign in to sync predictions across devices"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={combinedHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
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
