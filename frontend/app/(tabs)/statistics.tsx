import { AccessibilityCard } from "@/components/statistics/accessibility-card";
import { StatisticsMap } from "@/components/statistics/map-view";
import { PriceRange } from "@/components/statistics/price-range";
import { SimpleBarChart } from "@/components/statistics/simple-bar-chart";
import { StatCard } from "@/components/statistics/stat-card";
import { StatsTypeToggle } from "@/components/statistics/type-toggle";
import { getMapData, getStatistics } from "@/services/api";
import { MapListing, StatisticsResponse } from "@/types/statistics.types";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator, StyleSheet } from "react-native";

const toBarChartData = (distribution: Record<string, number>, color?: string) =>
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({
      label,
      value,
      color,
    }));

export default function StatisticsScreen() {
  const [type, setType] = useState<"sales" | "rentals">("sales");
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [mapData, setMapData] = useState<MapListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [type]);

  const load = async () => {
    setLoading(true);
    try {
      const [statistics, map] = await Promise.all([
        getStatistics(type),
        getMapData(150),
      ]);
      setStats(statistics);
      setMapData(map);
    } finally {
      setLoading(false);
    }
  };

  const memoizedMap = useMemo(
    () => <StatisticsMap data={mapData} />,
    [mapData]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const s = stats.statistics;
  const municipalityData = toBarChartData(s.municipality.distribution, "#3b82f6");
  const conditionData = toBarChartData(s.condition.distribution, "#10b981");
  const heatingData = toBarChartData(s.heating.distribution, "#f59e0b");

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Market Statistics</Text>
          <Text style={styles.headerSubtitle}>
            Real estate market overview and trends
          </Text>
          <View style={styles.toggleContainer}>
            <StatsTypeToggle value={type} onChange={setType} />
          </View>
        </View>

        {/* Price Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Overview</Text>
          
          <View style={styles.cardSpacing}>
            <PriceRange min={s.price.min} max={s.price.max} />
          </View>
          
          <View style={styles.cardSpacing}>
            <StatCard
              title="Average Price"
              value={`${s.price.average.toLocaleString()} KM`}
              subtitle={`Median: ${s.price.median.toLocaleString()} KM`}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <StatCard 
                title="Avg Size" 
                value={`${s.size_m2.average} m²`} 
              />
            </View>
            <View style={styles.halfCard}>
              <StatCard
                title="Price / m²"
                value={`${Math.round(s.price_per_m2.average)} KM`}
              />
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geographic Distribution</Text>
          <View style={styles.mapContainer}>
            {memoizedMap}
          </View>
        </View>

        {/* Distribution Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Distribution</Text>
          
          <View style={styles.cardSpacing}>
            <SimpleBarChart title="Top Municipalities" data={municipalityData} />
          </View>
          
          <View style={styles.cardSpacing}>
            <SimpleBarChart title="Property Condition" data={conditionData} />
          </View>
          
          <View style={styles.cardSpacing}>
            <SimpleBarChart title="Heating Systems" data={heatingData} />
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility Features</Text>
          <AccessibilityCard data={s.accessibility} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  noDataText: {
    color: "#334155",
    fontSize: 18,
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  toggleContainer: {
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
});