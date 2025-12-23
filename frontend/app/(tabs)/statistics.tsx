import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { API_URL } from "../../constants/config";
import { StatCard } from "@/components/statistics/stat-card";
import { SimpleBarChart } from "@/components/statistics/simple-bar-chart";
import { PriceCard } from "@/components/statistics/price-card";
import { Ionicons } from "@expo/vector-icons";

interface MunicipalityStats {
  municipality: string;
  total_count: number;
  prodaja: {
    count: number;
    avg_price: number;
    avg_size: number;
    price_per_m2: number;
  };
  iznajmljivanje: {
    count: number;
    avg_price: number;
    avg_size: number;
    price_per_m2: number;
  };
}

interface MapListing {
  id: number;
  title: string;
  price_numeric: number;
  square_m2: number;
  rooms: number;
  municipality: string;
  latitude: number;
  longitude: number;
  deal_score: number;
  marker_color: string;
  fairness: string;
}

interface SummaryStats {
  prodaja: {
    total_listings: number;
    olx_listings: number;
    nekretnine_listings: number;
    price_stats: {
      min: number;
      max: number;
      avg: number;
    };
  };
  iznajmljivanje: {
    total_listings: number;
    olx_listings: number;
    nekretnine_listings: number;
    price_stats: {
      min: number;
      max: number;
      avg: number;
    };
  };
}

export default function StatisticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [municipalityStats, setMunicipalityStats] = useState<
    MunicipalityStats[]
  >([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [mapListings, setMapListings] = useState<MapListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setError(null);

      // Fetch summary statistics
      const summaryRes = await fetch(`${API_URL}/api/v2/statistics/summary`);
      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummaryStats(summaryData.data);
      }

      // Fetch municipality statistics
      const municipalityRes = await fetch(
        `${API_URL}/api/v2/statistics/by-municipality`
      );
      if (!municipalityRes.ok)
        throw new Error("Failed to fetch municipality stats");
      const municipalityData = await municipalityRes.json();
      if (municipalityData.success) {
        setMunicipalityStats(municipalityData.data);
      }

      // Fetch map data with error handling
      try {
        const mapRes = await fetch(
          `${API_URL}/api/v2/statistics/map-data?limit=500`
        );
        if (mapRes.ok) {
          const mapData = await mapRes.json();
          if (mapData.success && Array.isArray(mapData.data)) {
            setMapListings(mapData.data);
          }
        }
      } catch (mapError) {
        console.log("Map data not available:", mapError);
        // Continue without map data
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatistics();
  }, []);

  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}k KM`;
  };

  const formatNumber = (num?: number | null) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0";
    return num.toLocaleString("bs-BA");
  };

  // Memoize map markers to prevent re-rendering on every update
  const mapMarkers = useMemo(() => {
    return mapListings.map((listing) => (
      <Marker
        key={`marker-${listing.id}`}
        coordinate={{
          latitude: listing.latitude,
          longitude: listing.longitude,
        }}
        pinColor={listing.marker_color}
        title={listing.title}
        description={`${formatPrice(listing.price_numeric)} • ${
          listing.rooms
        } rooms • ${listing.square_m2}m²`}
      >
        <View
          style={[
            styles.customMarker,
            { backgroundColor: listing.marker_color },
          ]}
        />
      </Marker>
    ));
  }, [mapListings]);

  const summaryTotals = useMemo(() => {
    if (!summaryStats) return null;
    const prodaja = summaryStats.prodaja || {
      total_listings: 0,
      olx_listings: 0,
      nekretnine_listings: 0,
      price_stats: { min: 0, max: 0, avg: 0 },
    };
    const iznajmljivanje = summaryStats.iznajmljivanje || {
      total_listings: 0,
      olx_listings: 0,
      nekretnine_listings: 0,
      price_stats: { min: 0, max: 0, avg: 0 },
    };

    return {
      total: prodaja.total_listings + iznajmljivanje.total_listings,
      prodaja,
      iznajmljivanje,
    };
  }, [summaryStats]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          📊 Market Insights
        </Text>
        <Text style={styles.subtitle}>
          Real-time data from Sarajevo real estate market
        </Text>
      </View>

      {/* Summary Cards */}
      {summaryTotals && (
        <View style={styles.summaryContainer}>
          <StatCard
            value={formatNumber(summaryTotals.total)}
            label="Total Active"
            color="#3b82f6"
          />
          <StatCard
            value={formatPrice(summaryTotals.prodaja.price_stats.avg)}
            label="Avg Sale Price"
            color="#10b981"
          />
          <StatCard
            value={formatNumber(summaryTotals.prodaja.total_listings)}
            label="Sale Listings"
            color="#8b5cf6"
          />
          <StatCard
            value={formatPrice(summaryTotals.iznajmljivanje.price_stats.avg)}
            label="Avg Rent Price"
            color="#f59e0b"
          />
        </View>
      )}

      {/* Map Section */}
      {mapListings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>
              Listings Map
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {mapListings.length} properties with color-coded pricing
          </Text>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#10b981" }]}
              />
              <Text style={styles.legendText}>Excellent Deal</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#3b82f6" }]}
              />
              <Text style={styles.legendText}>Good</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#f59e0b" }]}
              />
              <Text style={styles.legendText}>Fair</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#ef4444" }]}
              />
              <Text style={styles.legendText}>Overpriced</Text>
            </View>
          </View>

          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: 43.8563,
              longitude: 18.4131,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
          >
            {mapMarkers}
          </MapView>
        </View>
      )}

      {/* Municipality Statistics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart-outline" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>
            Top Municipalities
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Ranked by listing count and average prices
        </Text>

        {/* Bar Chart for Top 5 */}
        {municipalityStats.length > 0 && (
          <SimpleBarChart
            title="Listings by Municipality"
            data={municipalityStats.slice(0, 5).map((stat) => ({
              label: stat.municipality,
              value: stat.total_count,
              color: "#3b82f6",
            }))}
          />
        )}

        {/* Detailed Cards */}
        <View style={styles.cardsContainer}>
          {municipalityStats.slice(0, 8).map((stat, index) => {
            const combinedCount =
              stat.total_count ||
              stat.prodaja.count + stat.iznajmljivanje.count;

            const combinedAvgPrice =
              combinedCount > 0
                ? (
                    (stat.prodaja.avg_price * stat.prodaja.count +
                      stat.iznajmljivanje.avg_price *
                        stat.iznajmljivanje.count) /
                    combinedCount
                  )
                : 0;

            const combinedAvgSize =
              combinedCount > 0
                ? (
                    (stat.prodaja.avg_size * stat.prodaja.count +
                      stat.iznajmljivanje.avg_size *
                        stat.iznajmljivanje.count) /
                    combinedCount
                  )
                : 0;

            const combinedPricePerM2 =
              combinedAvgSize > 0
                ? combinedAvgPrice / combinedAvgSize
                : 0;

            return (
              <PriceCard
                key={stat.municipality}
                municipality={stat.municipality}
                avgPrice={combinedAvgPrice}
                avgSize={combinedAvgSize}
                pricePerM2={combinedPricePerM2}
                count={combinedCount}
                rank={index + 1}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    color: "#1f2937",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#1f2937",
    fontSize: 15,
    opacity: 0.7,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    backgroundColor: "#f5f5f5",
  },
  section: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    color: '#000000',
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  map: {
    width: "100%",
    height: 400,
    borderRadius: 16,
  },
  customMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  cardsContainer: {
    marginTop: 12,
  },
});
