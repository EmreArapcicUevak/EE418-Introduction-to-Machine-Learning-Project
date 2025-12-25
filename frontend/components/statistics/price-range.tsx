import { View, Text, StyleSheet } from "react-native";

export const PriceRange = ({ min, max }: { min: number; max: number }) => (
  <View style={styles.container}>
    <View style={styles.section}>
      <Text style={styles.label}>Minimum</Text>
      <Text style={styles.value}>{min.toLocaleString()}</Text>
      <Text style={styles.currency}>KM</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.section}>
      <Text style={styles.label}>Maximum</Text>
      <Text style={styles.value}>{max.toLocaleString()}</Text>
      <Text style={styles.currency}>KM</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
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
  section: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  currency: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  divider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
  },
});