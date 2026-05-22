import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, Linking, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DeliveryMap from '../components/DeliveryMap';
import {
  COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW, tabBar,
} from 'shared/theme';
import { formatMoney, formatOrderId, formatPhone } from 'shared/formatters';
import OrderStatusBar from 'shared/components/OrderStatusBar';
import api from 'shared/api';
import { connectSocket } from 'shared/socket';
import { getJSON, setJSON, removeItem } from 'shared/storage';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

function formatDeliveryAddress(addr) {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr || '—';
  if (addr.address) return addr.address;
  return [addr.label, addr.street, addr.area, addr.city].filter(Boolean).join(', ') || '—';
}

function formatPickupAddress(loc) {
  if (!loc) return null;
  if (typeof loc === 'string') return loc || null;
  return loc.address || [loc.street, loc.area, loc.city].filter(Boolean).join(', ') || null;
}

function toMapCoords(loc) {
  if (!loc) return null;
  if (loc.latitude  !== undefined) return { latitude: loc.latitude,  longitude: loc.longitude };
  if (loc.lat       !== undefined) return { latitude: loc.lat,       longitude: loc.lng };
  if (Array.isArray(loc.coordinates)) return { latitude: loc.coordinates[1], longitude: loc.coordinates[0] };
  return null;
}

function openMapsNavigation(address) {
  if (!address || address === '—') {
    Alert.alert('No address', 'Delivery address is not available.');
    return;
  }
  const encoded = encodeURIComponent(address);
  const url = Platform.OS === 'ios'
    ? `maps://maps.apple.com/?daddr=${encoded}`
    : `google.navigation:q=${encoded}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`)
  );
}

export default function ActiveDelivery({ route, navigation }) {
  const insets = useSafeAreaInsets();

  const [orderId,   setOrderId]   = useState(route?.params?.orderId ?? null);
  const [order,     setOrder]     = useState(route?.params?.order   ?? null);
  const [coords,    setCoords]    = useState(null);
  const [loading,   setLoading]   = useState(!route?.params?.order);
  const [error,     setError]     = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const watcherRef    = useRef(null);
  const socketRef     = useRef(null);
  // Tracks which orderId the success screen belongs to — reset delivered when a new order arrives
  const deliveredFor  = useRef(null);

  // Tab bar + safe-area aware bottom offset for the sticky CTA
  const ctaBottom = tabBar.height + Math.max(insets.bottom, tabBar.bottomGap) + SPACING.md;
  // ScrollView needs enough space for CTA (≈60px) + ctaBottom + extra breathing room
  const scrollPb  = ctaBottom + 80;

  useFocusEffect(
    useCallback(() => {
      const paramOrderId = route?.params?.orderId;
      const paramOrder   = route?.params?.order;

      function applyOrder(id, ord) {
        // Reset the success screen whenever a new order arrives
        if (id && id !== deliveredFor.current) {
          setDelivered(false);
        }
        setOrderId(id);
        if (ord) setOrder(ord);
      }

      if (paramOrderId) {
        applyOrder(paramOrderId, paramOrder);
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      (async () => {
        const saved = await getJSON('kebite_active_delivery');
        if (saved?.orderId && active) {
          applyOrder(saved.orderId, saved.order ?? null);
          setLoading(false);
          return;
        }
        try {
          const res = await api.get('/rider/orders/active');
          if (res.data?.order && active) {
            const { order: activeOrder } = res.data;
            await setJSON('kebite_active_delivery', { orderId: activeOrder._id, order: activeOrder });
            applyOrder(activeOrder._id, activeOrder);
          }
        } catch {}
        if (active) setLoading(false);
      })();
      return () => { active = false; };
    }, [route?.params?.orderId, route?.params?.order])
  );

  useEffect(() => {
    if (!orderId) return;
    let active = true;

    (async () => {
      const s = await connectSocket();
      if (s && active) {
        socketRef.current = s;
        s.emit('join:order', { orderId });
        s.on('order:statusUpdate', ({ orderId: id, status }) => {
          if (active && id === orderId) {
            setOrder((prev) => prev ? { ...prev, status } : prev);
          }
        });
      }

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
          api.put('/rider/me/location', { lat: latitude, lng: longitude, orderId }).catch(() => {});
          if (socketRef.current) {
            socketRef.current.emit('rider:locationUpdate', { orderId, lat: latitude, lng: longitude });
          }
        }
      );
    })();

    return () => {
      active = false;
      if (watcherRef.current) watcherRef.current.remove();
      if (socketRef.current) socketRef.current.off('order:statusUpdate');
    };
  }, [orderId]);

  async function confirmDelivered() {
    if (advancing) return;

    const proceed = Platform.OS === 'web'
      ? window.confirm('Mark this order as delivered?')
      : await new Promise((resolve) =>
          Alert.alert(
            'Confirm delivery',
            'Has the customer received their order?',
            [
              { text: 'Not yet', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Yes, delivered ✓', style: 'default', onPress: () => resolve(true) },
            ]
          )
        );

    if (!proceed) return;

    setAdvancing(true);
    try {
      await api.put(`/rider/orders/${orderId}/delivered`);
      await removeItem('kebite_active_delivery');
      deliveredFor.current = orderId; // mark so the success screen isn't wiped on re-focus
      setDelivered(true);
      setOrder((prev) => prev ? { ...prev, status: 'delivered' } : prev);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not confirm delivery. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setAdvancing(false);
    }
  }

  function callCustomer() {
    const phone = order?.userId?.phone;
    if (!phone) { Alert.alert('Unavailable', 'Customer phone number is not available.'); return; }
    Linking.openURL(`tel:${formatPhone(phone)}`).catch(() =>
      Alert.alert("Can't call", 'Phone dialer is not available on this device.')
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={COLORS.orange} size="large" />
        <Text style={styles.emptyText}>Loading delivery…</Text>
      </View>
    );
  }

  if (error) return <ErrorCard message={error} onRetry={() => navigation.goBack()} />;

  if (!orderId || !order) {
    return (
      <View style={[styles.empty, { paddingBottom: ctaBottom }]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="bicycle-outline" size={48} color={COLORS.textLight} />
        </View>
        <Text style={styles.emptyTitle}>No active delivery</Text>
        <Text style={styles.emptyHint}>Accept an order from the dashboard to start a delivery.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const restaurantName   = order.restaurantId?.name   || 'Restaurant';
  const customerName     = order.userId?.name         || 'Customer';
  const restaurantCoords = toMapCoords(order.restaurantId?.location);
  const pickupAddress    = formatPickupAddress(order.restaurantId?.location);
  const deliveryAddress  = formatDeliveryAddress(order.deliveryAddress);
  const deliveryFee      = order.deliveryFee || 0;
  const orderTotal       = order.total       || 0;
  const isDelivered      = order.status === 'delivered' || delivered;
  const canConfirm       = order.status === 'on_the_way' && !isDelivered;

  const initialRegion = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: -6.7924, longitude: 39.2083, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  // ── Delivered success state ──
  if (isDelivered && delivered) {
    return (
      <View style={[styles.successScreen, { paddingBottom: ctaBottom + SPACING.xl }]}>
        <LinearGradient colors={[NAVY, NAVY2]} style={StyleSheet.absoluteFill} />
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={COLORS.successText} />
        </View>
        <Text style={styles.successTitle}>Delivered! 🎉</Text>
        <Text style={styles.successSub}>Great work on completing this delivery.</Text>

        <View style={styles.successEarnCard}>
          <Text style={styles.successEarnLabel}>You earned</Text>
          <Text style={styles.successEarnValue}>{formatMoney(deliveryFee)}</Text>
          <Text style={styles.successEarnNote}>Will reflect in your wallet within 24h</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.successBtn}
          activeOpacity={0.88}
        >
          <Text style={styles.successBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[NAVY, NAVY2]} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order #{formatOrderId(orderId)}</Text>
          <Text style={styles.headerSub}>{restaurantName}</Text>
        </View>
        {/* Call customer shortcut in header */}
        <TouchableOpacity onPress={callCustomer} accessibilityLabel="Call customer" style={styles.headerBack}>
          <Ionicons name="call-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: scrollPb }}
        showsVerticalScrollIndicator={false}
      >
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
          <View style={[styles.locationIcon, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
            <Ionicons name="restaurant-outline" size={18} color={COLORS.activeOrange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Pickup from</Text>
            <Text style={styles.locationName}>{restaurantName}</Text>
            {pickupAddress ? (
              <Text style={styles.locationAddress} numberOfLines={2}>{pickupAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* Drop-off */}
        <View style={styles.locationCard}>
          <View style={[styles.locationIcon, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
            <Ionicons name="location-outline" size={18} color={COLORS.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Drop-off to</Text>
            <Text style={styles.locationName}>{customerName}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{deliveryAddress}</Text>
          </View>
          {/* Action buttons — call + navigate */}
          <View style={styles.actionBtns}>
            <TouchableOpacity
              onPress={callCustomer}
              accessibilityLabel="Call customer"
              style={[styles.actionBtn, { backgroundColor: 'rgba(220,38,38,0.08)' }]}
            >
              <Ionicons name="call-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openMapsNavigation(deliveryAddress)}
              accessibilityLabel="Navigate to customer"
              style={[styles.actionBtn, { backgroundColor: 'rgba(37,99,235,0.1)' }]}
            >
              <Ionicons name="navigate-outline" size={18} color="#2563eb" />
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
            <Ionicons name="cash-outline" size={22} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.earnLabel}>Your delivery fee</Text>
            <Text style={styles.earnValue}>{formatMoney(deliveryFee)}</Text>
          </View>
          <View style={styles.orderTotalBox}>
            <Text style={styles.orderTotalLabel}>Order total</Text>
            <Text style={styles.orderTotalValue}>{formatMoney(orderTotal)}</Text>
          </View>
        </LinearGradient>

        {/* Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>
            {(order.items || []).length} item{order.items?.length !== 1 ? 's' : ''}
          </Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQty}>{item.quantity}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name || 'Item'}</Text>
              {item.price > 0 && (
                <Text style={styles.itemPrice}>{formatMoney(item.price * item.quantity)}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky CTA — sits above the tab bar ── */}
      {canConfirm && (
        <View style={[styles.ctaWrap, { bottom: ctaBottom }]}>
          <TouchableOpacity
            onPress={confirmDelivered}
            disabled={advancing}
            accessibilityLabel="Confirm delivered"
            activeOpacity={0.88}
            style={{ borderRadius: RADIUS.xl, overflow: 'hidden' }}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.ctaBtn}>
              {advancing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <View style={styles.ctaIconWrap}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ctaText}>Confirm Delivered</Text>
                    <Text style={styles.ctaSub}>Tap when customer has the order</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Delivered — but not yet showing success screen (e.g. status update via socket) */}
      {isDelivered && !delivered && (
        <View style={[styles.ctaWrap, { bottom: ctaBottom }]}>
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.successText} />
            <Text style={styles.deliveredBannerText}>Order delivered successfully</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.sm,
  },
  headerBack: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.xs, marginTop: 2 },

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
    flexDirection:    'row',
    alignItems:       'flex-start',
    gap:              SPACING.md,
    ...SHADOW.sm,
  },
  pickupCard:      { borderLeftWidth: 3, borderLeftColor: COLORS.activeOrange },
  locationIcon: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      2,
  },
  locationLabel:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase' },
  locationName:    { color: COLORS.dark, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  locationAddress: { color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginTop: 3, lineHeight: 18 },

  actionBtns: { flexDirection: 'column', gap: SPACING.xs, alignSelf: 'center' },
  actionBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
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
    flexShrink:      0,
  },
  earnLabel: { color: 'rgba(255,255,255,0.65)', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase' },
  earnValue: { color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  orderTotalBox: {
    alignItems:       'flex-end',
    paddingLeft:      SPACING.md,
    borderLeftWidth:  1,
    borderLeftColor:  'rgba(255,255,255,0.15)',
  },
  orderTotalLabel: { color: 'rgba(255,255,255,0.55)', fontSize: FONT_SIZE.xs },
  orderTotalValue: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },

  itemsCard: {
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.lg,
    padding:          SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.md,
    ...SHADOW.sm,
  },
  itemsTitle: { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm, fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  itemQtyBadge: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  itemQty:   { color: COLORS.activeOrange, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  itemName:  { flex: 1, color: COLORS.textBody, fontSize: FONT_SIZE.sm },
  itemPrice: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },

  // ── Sticky CTA ──
  ctaWrap: {
    position:          'absolute',
    left:              SPACING.lg,
    right:             SPACING.lg,
  },
  ctaBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:  SPACING.md + 4,
    paddingHorizontal:SPACING.lg,
    borderRadius:     RADIUS.xl,
    gap:              SPACING.md,
  },
  ctaIconWrap: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  ctaText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  ctaSub:  { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.xs, marginTop: 2 },

  deliveredBanner: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              SPACING.sm,
    backgroundColor:  COLORS.successBg,
    borderRadius:     RADIUS.xl,
    paddingVertical:  SPACING.md + 4,
    borderWidth:      1,
    borderColor:      COLORS.successText + '40',
  },
  deliveredBannerText: { color: COLORS.successText, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },

  // ── Empty state ──
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor:COLORS.pageBg,
    gap:            SPACING.md,
    padding:        SPACING.xl,
  },
  emptyIconWrap: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: COLORS.border + '40',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.sm,
  },
  emptyTitle: { color: COLORS.dark, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  emptyHint:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop:        SPACING.md,
    paddingHorizontal:SPACING.xl,
    paddingVertical:  SPACING.md,
    borderRadius:     RADIUS.pill,
    backgroundColor:  COLORS.activeOrange,
  },
  emptyBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },

  // ── Delivered success ──
  successScreen: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        SPACING.xl,
    gap:            SPACING.md,
  },
  successIconWrap: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: 'rgba(22,163,74,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.sm,
  },
  successTitle:    { color: '#fff', fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold },
  successSub:      { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.base, textAlign: 'center' },
  successEarnCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    RADIUS.xl,
    padding:         SPACING.xl,
    alignItems:      'center',
    width:           '100%',
    marginTop:       SPACING.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.15)',
  },
  successEarnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm },
  successEarnValue: { color: '#fff', fontSize: 36, fontWeight: FONT_WEIGHT.bold, marginVertical: SPACING.sm },
  successEarnNote:  { color: 'rgba(255,255,255,0.5)', fontSize: FONT_SIZE.xs, textAlign: 'center' },
  successBtn: {
    marginTop:        SPACING.lg,
    paddingHorizontal:SPACING.xxxl ?? 40,
    paddingVertical:  SPACING.md + 4,
    borderRadius:     RADIUS.pill,
    backgroundColor:  'rgba(255,255,255,0.15)',
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.25)',
  },
  successBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
});
