import { StyleSheet, Text, View } from 'react-native';

// Dummy MapView for web/Expo Go
const MapView = ({ style, children, ...props }: any) => (
  <View style={[styles.placeholder, style]}>
    <Text style={styles.placeholderText}>🗺️ Map Preview</Text>
    <Text style={styles.subText}>
      Maps require development build.{'\n'}
      Use coordinate inputs below.
    </Text>
    {children}
  </View>
);

// Dummy Marker component
export const Marker = ({ children }: any) => null;

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  placeholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  subText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default MapView;

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
