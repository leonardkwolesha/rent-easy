import MapView, { Marker } from 'react-native-maps';
import { BRAND } from 'shared/theme';

export default function DeliveryMap({ initialRegion, restaurantCoords, restaurantName, customerCoords, style }) {
  return (
    <MapView style={style} initialRegion={initialRegion} showsUserLocation>
      {restaurantCoords && (
        <Marker coordinate={restaurantCoords} title={restaurantName || 'Restaurant'} pinColor={BRAND.orange} />
      )}
      {customerCoords && (
        <Marker coordinate={customerCoords} title="Customer" pinColor={BRAND.red} />
      )}
    </MapView>
  );
}
