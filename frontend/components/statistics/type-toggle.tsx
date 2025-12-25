import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const StatsTypeToggle = ({
  value,
  onChange,
}: {
  value: "sales" | "rentals";
  onChange: (v: "sales" | "rentals") => void;
}) => (
  <View style={styles.container}>
    {(["sales", "rentals"] as const).map((v) => (
      <TouchableOpacity
        key={v}
        onPress={() => onChange(v)}
        style={[styles.button, value === v && styles.active]}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, value === v && styles.activeText]}>
          {v === "sales" ? "Sales" : "Rentals"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  active: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "600",
  },
  activeText: {
    color: "#0f172a",
  },
});