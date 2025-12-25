import { View, Text, StyleSheet } from "react-native";

export const AccessibilityCard = ({ data }: { data: Record<string, number> }) => (
  <View style={styles.card}>
    <Text style={styles.title}>Accessibility Features</Text>
    <View style={styles.grid}>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.item}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getIcon(key)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>
              {formatLabel(key)}
            </Text>
            <Text style={styles.value}>{Math.round(value)}m</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const getIcon = (key: string) => {
  const icons: Record<string, string> = {
    closest_school: "🏫",
    closest_hospital: "🏥",
    closest_park: "🌳",
    closest_market: "🛒",
    closest_transport: "🚌",
  };
  return icons[key] || "📍";
};

const formatLabel = (key: string) => {
  return key
    .replace("closest_", "")
    .replace("_", " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
});