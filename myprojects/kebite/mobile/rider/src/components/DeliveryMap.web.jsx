import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from 'shared/theme';

export default function DeliveryMap({ initialRegion, restaurantCoords, restaurantName, customerCoords, style }) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="map-outline" size={48} color={BRAND.orange} />
      <Text style={styles.title}>Map preview not available on web</Text>
      <Text style={styles.body}>Open the rider app on a device or emulator to see live navigation.</Text>
      {initialRegion && (
        <Text style={styles.coords}>
          Center: {initialRegion.latitude.toFixed(4)}, {initialRegion.longitude.toFixed(4)}
        </Text>
      )}
      {restaurantCoords && (
        <Text style={styles.coords}>
          🍽 {restaurantName || 'Restaurant'}: {restaurantCoords.latitude.toFixed(4)}, {restaurantCoords.longitude.toFixed(4)}
        </Text>
      )}
      {customerCoords && (
        <Text style={styles.coords}>
          📍 Customer: {customerCoords.latitude.toFixed(4)}, {customerCoords.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#eef0f3', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { color: BRAND.dark, fontWeight: '700', marginTop: 12, fontSize: 16 },
  body:      { color: '#666', marginTop: 4, textAlign: 'center' },
  coords:    { color: '#444', marginTop: 8, fontSize: 13 },
});
