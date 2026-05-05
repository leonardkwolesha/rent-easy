import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DeliveryMap from '../components/DeliveryMap';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId, formatPhone } from '../../../shared/formatters';
import OrderStatusBar from '../../../shared/components/OrderStatusBar';
import api from '../../../shared/api';
import { connectSocket } from '../../../shared/socket';
import { getJSON, removeItem } from '../../../shared/storage';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

// After accept the server sets status to on_the_way immediately.
// The only rider action is to confirm delivery.
const NEXT_LABEL = { on_the_way: 'Confirm Delivered' };
const NEXT_ICON  = { on_the_way: 'checkmark-circle'  };

function formatDeliveryAddress(addr) {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr;
  return [addr.label, addr.street, addr.area, addr.city].filter(Boolean).join(', ') || '—';
}

function toMapCoords(loc) {
  if (!loc) return null;
  if (loc.latitude  !== undefined) return { latitude: loc.latitude,  longitude: loc.longitude };
  if (loc.lat       !== undefined) return { latitude: loc.lat,       longitude: loc.lng };
  if (Array.isArray(loc.coordinates)) return { latitude: loc.coordinates[1], longitude: loc.coordinates[0] };
  return null;
}

export default function ActiveDelivery({ route, navigation }) {
  const orderId = route?.params?.orderId;

  // Order comes from navigation params (set by Dashboard after accept).
  // Fall back to AsyncStorage for app-restart recovery.
  const [order,   setOrder]   = useState(route?.params?.order ?? null);
  const [coords,  setCoords]  = useState(null);
  const [loading, setLoading] = useState(!route?.params?.order);
  const [error,   setError]   = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const watcherRef  = useRef(null);
  const socketRef   = useRef(null);

  // If order wasn't passed via params, try AsyncStorage
  useEffect(() => {
    if (order) return;
    let active = true;
    (async () => {
      const saved = await getJSON('kebite_active_delivery');
      if (active && saved?.order) setOrder(saved.order);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  // GPS tracking + socket
  useEffect(() => {
    if (!orderId) return;
    let active = true;

    (async () => {
      const s = await connectSocket();
      if (s && active) socketRef.current = s;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'GPS access is required for active deliveries.');
        return;
      }

      watcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (active) setCoords({ latitude, longitude });
          api.put('/rider/me/location', { lat: latitude, lng: longitude }).catch(() => {});
          if (socketRef.current) {
            socketRef.current.emit('rider:locationUpdate', { orderId, lat: latitude, lng: longitude });
          }
        }
      );
    })();

    return () => {
      active = false;
      if (watcherRef.current) watcherRef.current.remove();
    };
  }, [orderId]);

  async function confirmDelivered() {
    if (advancing) return;
    Alert.alert('Confirm delivery', 'Mark this order as delivered?', [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Yes, delivered', onPress: async () => {
          setAdvancing(true);
          try {
            await api.put(`/rider/orders/${orderId}/delivered`);
            await removeItem('kebite_active_delivery');
            Alert.alert(
              'Delivered! 🎉',
              `Great work! You earned ${formatMoney(order?.deliveryFee || 0)}.`,
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
            );
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not confirm delivery.');
          } finally {
            setAdvancing(false);
          }
        },
      },
    ]);
  }

  function callCustomer() {
    const phone = order?.userId?.phone;
    if (!phone) { Alert.alert('Unavailable', 'Customer phone not available.'); return; }
    Linking.openURL(`tel:${formatPhone(phone)}`).catch(() =>
      Alert.alert("Can't call", 'Phone dialer is not available.')
    );
  }

  if (!orderId) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bicycle-outline" size={56} color={COLORS.border} />
        <Text style={styles.emptyText}>No active delivery.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.emptyLink}>
          <Text style={styles.emptyLinkText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }

  if (error) return <ErrorCard message={error} onRetry={() => navigation.goBack()} />;
  if (!order) return null;

  const restaurantName   = order.restaurantId?.name   || 'Restaurant';
  const customerName     = order.userId?.name         || 'Customer';
  const restaurantCoords = toMapCoords(order.restaurantId?.location);
  const deliveryFee      = order.deliveryFee || 0;
  const isDelivered      = order.status === 'delivered';
  const canConfirm       = order.status === 'on_the_way' && !isDelivered;

  const initialRegion = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: -6.7924, longitude: 39.2083, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>#{formatOrderId(orderId)}</Text>
          <Text style={styles.headerSub}>{restaurantName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Status bar */}
        <View style={styles.statusCard}>
          <OrderStatusBar status={order.status} />
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <DeliveryMap
            style={styles.map}
            initialRegion={initialRegion}
            restaurantCoords={restaurantCoords}
            restaurantName={restaurantName}
            customerCoords={null}
          />
        </View>

        {/* Pickup */}
        <View style={[styles.locationCard, styles.pickupCard]}>
          <View style={styles.locationHead}>
            <View style={[styles.locationIcon, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.activeOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Pickup from</Text>
              <Text style={styles.locationName}>{restaurantName}</Text>
            </View>
          </View>
        </View>

        {/* Drop-off */}
        <View style={styles.locationCard}>
          <View style={styles.locationHead}>
            <View style={[styles.locationIcon, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
              <Ionicons name="location-outline" size={18} color={COLORS.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Drop-off to</Text>
              <Text style={styles.locationName}>{customerName}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {formatDeliveryAddress(order.deliveryAddress)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={callCustomer}
              accessibilityLabel="Call customer"
              style={styles.callBtn}
            >
              <Ionicons name="call-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings */}
        <LinearGradient
          colors={[NAVY, NAVY2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.earnCard}
        >
          <View style={styles.earnIconWrap}>
            <Ionicons name="cash-outline" size={24} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.earnLabel}>Your delivery fee</Text>
            <Text style={styles.earnValue}>{formatMoney(deliveryFee)}</Text>
          </View>
          {isDelivered && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.successText} />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
        </LinearGradient>

        {/* Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>{(order.items || []).length} item{order.items?.length !== 1 ? 's' : ''}</Text>
          {(order.items || []).map((item, i) => (
            <Text key={i} style={styles.itemLine} numberOfLines={1}>
              {item.quantity}× {item.name || 'Item'}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      {canConfirm && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            onPress={confirmDelivered}
            disabled={advancing}
            accessibilityLabel="Confirm delivered"
            activeOpacity={0.88}
            style={{ borderRadius: RADIUS.xl, overflow: 'hidden' }}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.ctaBtn}>
              {advancing
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.ctaText}>Confirm Delivered</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop:        52,
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.xs, marginTop: 2 },

  statusCard: {
    backgroundColor:  COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    borderRadius:     RADIUS.xl,
    padding:          SPACING.lg,
    ...SHADOW.sm,
  },

  mapCard: {
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    borderRadius:     RADIUS.xl,
    overflow:         'hidden',
    height:           180,
    ...SHADOW.sm,
  },
  map: { flex: 1, height: 180 },

  locationCard: {
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.lg,
    padding:          SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    ...SHADOW.sm,
  },
  pickupCard:   { borderLeftWidth: 3, borderLeftColor: COLORS.activeOrange },
  locationHead: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  locationIcon: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  locationLabel:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase' },
  locationName:    { color: COLORS.dark, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  locationAddress: { color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginTop: 2, lineHeight: 18 },
  callBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },

  earnCard: {
    flexDirection:    'row',
    alignItems:       'center',
    borderRadius:     RADIUS.xl,
    padding:          SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    gap:              SPACING.md,
    ...SHADOW.md,
  },
  earnIconWrap: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  earnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm },
  earnValue: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  paidBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  COLORS.successBg,
    borderRadius:     RADIUS.pill,
    paddingHorizontal:SPACING.sm,
    paddingVertical:  4,
  },
  paidText: { color: COLORS.successText, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  itemsCard: {
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.lg,
    padding:          SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    ...SHADOW.sm,
  },
  itemsTitle: { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm, fontSize: FONT_SIZE.sm },
  itemLine:   { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },

  ctaWrap: {
    position: 'absolute',
    left:     SPACING.lg,
    right:    SPACING.lg,
    bottom:   SPACING.xxl,
  },
  ctaBtn: {
    paddingVertical:  SPACING.lg,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              SPACING.sm,
    borderRadius:     RADIUS.xl,
  },
  ctaText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg, gap: SPACING.md },
  emptyText:     { color: COLORS.textMuted, fontSize: FONT_SIZE.md },
  emptyLink:     { marginTop: SPACING.sm },
  emptyLinkText: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold },
});
