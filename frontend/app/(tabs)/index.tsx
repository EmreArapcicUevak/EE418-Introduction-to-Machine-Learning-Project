import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "../../components/MapView";
import { SelectPicker } from "../../components/SelectPicker";
import { usePredictionHistory } from "../../hooks/use-prediction-history";
import { makePrediction } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  // Sarajevo Canton center coordinates
  const [longitude, setLongitude] = useState(18.4131);
  const [latitude, setLatitude] = useState(43.8563);
  const [condition, setCondition] = useState("Renovated");
  const [adType, setAdType] = useState("Sale");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [rooms, setRooms] = useState("");
  const [squareM2, setSquareM2] = useState("");
  const [equipment, setEquipment] = useState("Furnished");
  const [level, setLevel] = useState("");
  const [heating, setHeating] = useState("Central");
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { addRecord } = usePredictionHistory();
  const { user } = useAuth();

  const predictPrice = async () => {
    if (!rooms || !squareM2 || !level) {
      setError("Please fill in all required fields");
      return;
    }

    setError("");
    setLoading(true);
    setPrice(null);

    try {
      const data = await makePrediction({
        longitude,
        latitude,
        condition,
        ad_type: adType,
        property_type: propertyType,
        rooms: Number(rooms),
        square_m2: Number(squareM2),
        equipment,
        level: Number(level),
        heating,
      });

      setPrice(data.predicted_price);

      addRecord(
        {
          longitude,
          latitude,
          condition,
          ad_type: adType,
          property_type: propertyType,
          rooms: Number(rooms),
          square_m2: Number(squareM2),
          equipment,
          level: Number(level),
          heating,
        },
        data.price
      );
    } catch (err) {
      console.error(err);
      setError("Failed to fetch prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with gradient */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Real Estate Price</Text>
        <Text style={styles.headerSubtitle}>
          {user ? `Welcome, ${user.email}` : "AI-Powered Predictions"}
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Location (Tap on map or select area)</Text>
          <Text style={styles.subtitle}>
            Select a neighborhood from dropdown or tap directly on map
          </Text>

          {/* TODO: YOUR LOACTION */}

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 43.8563,
                longitude: 18.4131,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
              }}
              onPress={(e: any) => {
                const coords = e.nativeEvent.coordinate;
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
              }}
            >
              <Marker
                coordinate={{
                  latitude,
                  longitude,
                }}
                title="Selected Location"
                description={`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
              />
            </MapView>
          </View>

          <View style={styles.coordInputs}>
            <View style={styles.coordInputContainer}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <TextInput
                style={styles.coordInput}
                value={latitude.toFixed(4)}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num)) setLatitude(num);
                }}
                placeholder="43.8563"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.coordInputContainer}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <TextInput
                style={styles.coordInput}
                value={longitude.toFixed(4)}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num)) setLongitude(num);
                }}
                placeholder="18.4131"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Text style={styles.coordText}>
            📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </Text>

          <Text style={styles.label}>Ad Type</Text>
          <View style={styles.pickerContainer}>
            <SelectPicker
              selectedValue={adType}
              onValueChange={setAdType}
              items={[
                { label: "Sale", value: "Sale" },
                { label: "Rent", value: "Rent" },
              ]}
              style={styles.picker}
            />
          </View>

          {/* Condition only appears for Sale, not Rent */}
          {adType === "Sale" && (
            <>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.pickerContainer}>
                <SelectPicker
                  selectedValue={condition}
                  onValueChange={setCondition}
                  items={[
                    { label: "Renovated", value: "Renovated" },
                    { label: "New", value: "New" },
                    { label: "Used", value: "Used" },
                  ]}
                  style={styles.picker}
                />
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            value={rooms}
            onChangeText={setRooms}
            placeholder="Number of rooms *"
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            value={squareM2}
            onChangeText={setSquareM2}
            placeholder="Square meters *"
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            value={level}
            onChangeText={setLevel}
            placeholder="Floor level *"
            keyboardType="numeric"
          />

          {/* TODO: Input validators */}

          <Text style={styles.label}>Equipment</Text>
          <View style={styles.pickerContainer}>
            <SelectPicker
              selectedValue={equipment}
              onValueChange={setEquipment}
              items={[
                { label: "Furnished", value: "Furnished" },
                { label: "Semi-furnished", value: "Semi-furnished" },
                { label: "Unfurnished", value: "Unfurnished" },
              ]}
              style={styles.picker}
            />
          </View>

          <Text style={styles.label}>Heating</Text>
          <View style={styles.pickerContainer}>
            <SelectPicker
              selectedValue={heating}
              onValueChange={setHeating}
              items={[
                { label: "District Heating", value: "District Heating" },
                { label: "Gas Heating", value: "Gas Heating" },
                { label: "Electric Heating", value: "Electric Heating" },
                { label: "Central Gas Heating", value: "Central Gas Heating" },
                {
                  label: "Central (Boiler Room)",
                  value: "Central (Boiler Room)",
                },
                { label: "Other", value: "Other" },
              ]}
              style={styles.picker}
            />
          </View>

          <Pressable style={styles.button} onPress={predictPrice}>
            <Text style={styles.buttonText}>Predict Price</Text>
          </Pressable>

          {loading && (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          )}

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          {price !== null && (
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resultBox}
            >
              <Text style={styles.resultLabel}>💰 Predicted Price</Text>
              <Text style={styles.resultValue}>
                {price.toLocaleString()} KM
              </Text>
              <Text style={styles.resultSubtext}>
                ≈ €{(price / 2).toLocaleString()} EUR
              </Text>
            </LinearGradient>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#e0e7ff",
    fontWeight: "500",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    fontStyle: "italic",
  },
  coordInputs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  coordInputContainer: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  coordInput: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  mapContainer: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  coordText: {
    fontSize: 13,
    color: "#667eea",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    height: 54,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: "#667eea",
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  error: {
    marginTop: 20,
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    textAlign: "center",
    padding: 12,
    borderRadius: 12,
    fontWeight: "600",
  },
  resultBox: {
    marginTop: 32,
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    marginTop: 4,
  },
  resultSubtext: {
    fontSize: 16,
    color: "#d1fae5",
    fontWeight: "600",
    marginTop: 8,
  },
});
