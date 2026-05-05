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
import ErrorCard from '../components/ErrorCard';

// Rider-side delivery statuses map to the shared 6-stage lifecycle.
// The rider only controls: ready → on_the_way → delivered
const NEXT_STATUS = { ready: 'on_the_way', on_the_way: 'delivered' };
const NEXT_LABEL  = { ready: 'Picked up — Start delivery', on_the_way: 'Confirm Delivered' };
const NEXT_ICON   = { ready: 'bicycle',                    on_the_way: 'checkmark-circle' };

export default function ActiveDelivery({ route, navigation }) {
  const orderId = route?.params?.orderId;

  const [order, setOrder]     = useState(null);
  const [coords, setCoords]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const watcherRef            = useRef(null);
  const socketRef             = useRef(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    let isActive = true;

    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (isActive) setOrder(res.data);
      } catch (err) {
        if (isActive) setError(err?.response?.data?.message || 'Could not load order.');
      } finally {
        if (isActive) setLoading(false);
      }

      const s = await connectSocket();
      if (s && isActive) socketRef.current = s;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'GPS access is required for deliveries.');
        return;
      }

      watcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (isActive) setCoords({ latitude, longitude });
          if (socketRef.current) {
            socketRef.current.emit('rider:locationUpdate', { orderId, lat: latitude, lng: longitude });
          }
        }
      );
    })();

    return () => {
      isActive = false;
      if (watcherRef.current) watcherRef.current.remove();
    };
  }, [orderId]);

  async function advanceStatus() {
    const next = NEXT_STATUS[order?.status];
    if (!next) return;
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: next });
      setOrder(res.data);
      if (socketRef.current) {
        socketRef.current.emit('order:statusUpdate', { orderId, status: next });
      }
      if (next === 'delivered') {
        Alert.alert(
          'Delivered! 🎉',
          `You've earned ${formatMoney(order.deliveryFee || 2000)}. Great work!`,
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update status.');
    }
  }

  function callCustomer() {
    const phone = order?.customer?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${formatPhone(phone)}`).catch(() => {
      Alert.alert("Can't call", 'Phone dialer is not available.');
    });
  }

  function callRestaurant() {
    const phone = order?.restaurant?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${formatPhone(phone)}`).catch(() => {
      Alert.alert("Can't call", 'Phone dialer is not available.');
    });
  }

  if (!orderId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <Ionicons name="bicycle-outline" size={56} color={COLORS.border} />
        <Text style={{ color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZE.md }}>
          No active delivery.
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold }}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }
  if (error) return <ErrorCard message={error} onRetry={() => navigation.goBack()} />;
  if (!order) return null;

  const restaurantCoords = order.restaurant?.location || null;
  const customerCoords   = order.customerLocation || null;
  const initialRegion    = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: -6.7924, longitude: 39.2083, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const canAdvance     = !!NEXT_STATUS[order.status];
  const isDelivered    = order.status === 'delivered';
  const deliveryFee    = order.deliveryFee || 2000;

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>#{formatOrderId(orderId)}</Text>
          <Text style={styles.headerSub}>{order.restaurant?.name || 'Restaurant'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Delivery stage status bar */}
        <View style={styles.statusCard}>
          <OrderStatusBar status={order.status} />
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <DeliveryMap
            style={styles.map}
            initialRegion={initialRegion}
            restaurantCoords={restaurantCoords}
            restaurantName={order.restaurant?.name}
            customerCoords={customerCoords}
          />
        </View>

        {/* Pickup card */}
        <View style={[styles.locationCard, styles.pickupCard]}>
          <View style={styles.locationHead}>
            <View style={[styles.locationIcon, { backgroundColor: 'rgba(255,107,0,0.1)' }]}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.activeOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Pickup from</Text>
              <Text style={styles.locationName}>{order.restaurant?.name || 'Restaurant'}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {order.restaurant?.address || 'Address unavailable'}
              </Text>
            </View>
            {order.restaurant?.phone && (
              <TouchableOpacity
                onPress={callRestaurant}
                accessibilityLabel="Call restaurant"
                style={styles.callBtn}
              >
                <Ionicons name="call-outline" size={18} color={COLORS.activeOrange} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Drop-off card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHead}>
            <View style={[styles.locationIcon, { backgroundColor: 'rgba(230,57,70,0.1)' }]}>
              <Ionicons name="location-outline" size={18} color={COLORS.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Drop-off to</Text>
              <Text style={styles.locationName}>{order.customer?.name || 'Customer'}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {order.deliveryAddress || '—'}
              </Text>
            </View>
            {order.customer?.phone && (
              <TouchableOpacity
                onPress={callCustomer}
                accessibilityLabel="Call customer"
                style={styles.callBtn}
              >
                <Ionicons name="call-outline" size={18} color={COLORS.red} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Earnings card */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
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

        {/* Order items summary */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>{(order.items || []).length} items</Text>
          {(order.items || []).map((item, i) => (
            <Text key={i} style={styles.itemLine} numberOfLines={1}>
              {item.quantity}× {item.name || item.menuItem?.name || 'Item'}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      {canAdvance && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            onPress={advanceStatus}
            accessibilityLabel={NEXT_LABEL[order.status]}
            activeOpacity={0.88}
            style={{ borderRadius: RADIUS.xl, overflow: 'hidden' }}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.ctaBtn}>
              <Ionicons name={NEXT_ICON[order.status]} size={22} color="#fff" />
              <Text style={styles.ctaText}>{NEXT_LABEL[order.status]}</Text>
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
    backgroundColor: COLORS.cardBg,
    marginHorizontal:SPACING.lg,
    marginTop:       SPACING.md,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.lg,
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
  pickupCard: { borderLeftWidth: 3, borderLeftColor: COLORS.activeOrange },
  locationHead: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  locationIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  locationLabel:  { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase' },
  locationName:   { color: COLORS.dark, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  locationAddress:{ color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginTop: 2, lineHeight: 18 },
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
    backgroundColor: 'rgba(255,107,0,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  earnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm },
  earnValue: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  paidBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: COLORS.successBg,
    borderRadius:    RADIUS.pill,
    paddingHorizontal:SPACING.sm,
    paddingVertical: 4,
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
    position:        'absolute',
    left:            SPACING.lg,
    right:           SPACING.lg,
    bottom:          SPACING.xxl,
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
});
