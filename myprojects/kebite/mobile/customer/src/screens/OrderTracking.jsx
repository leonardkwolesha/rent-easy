import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, BRAND, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW,
         ORDER_STATUSES, STATUS_LABELS, STATUS_BADGE } from 'shared/theme';
import { formatMoney, formatOrderId } from 'shared/formatters';
import api from 'shared/api';
import { connectSocket } from 'shared/socket';
import OrderStatusBar from 'shared/components/OrderStatusBar';
import ErrorCard from '../components/ErrorCard';

const TIMELINE = ['placed', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];

const STATUS_MESSAGES = {
  placed:     'Your order has been received',
  confirmed:  'Restaurant has confirmed your order',
  preparing:  'Your food is being prepared 🍳',
  ready:      'Order is ready and waiting for pickup',
  on_the_way: 'Rider is on the way to you 🛵',
  delivered:  'Order delivered — enjoy your meal! 🎉',
};

const ETA_MINUTES = {
  placed:     45,
  confirmed:  35,
  preparing:  25,
  ready:      15,
  on_the_way: 8,
  delivered:  0,
};

export default function OrderTracking({ route, navigation }) {
  const { orderId }               = route.params;
  const [order, setOrder]         = useState(null);
  const [riderLoc, setRider]      = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const socketRef                 = useRef(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (active) setOrder(res.data);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load order.');
      } finally {
        if (active) setLoading(false);
      }

      const s = await connectSocket();
      if (s && active) {
        socketRef.current = s;
        // Join the order room so targeted emits reach this screen
        s.emit('join:order', { orderId });
        s.on('order:statusUpdate', (payload) => {
          if (payload.orderId === orderId && active) {
            setOrder((prev) => prev ? { ...prev, status: payload.status } : prev);
          }
        });
        s.on('rider:locationUpdate', (payload) => {
          if (payload.orderId === orderId && active) {
            setRider({ lat: payload.lat, lng: payload.lng });
          }
        });
      }
    })();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.off('order:statusUpdate');
        socketRef.current.off('rider:locationUpdate');
      }
    };
  }, [orderId]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }
  if (error) {
    return <ErrorCard message={error} onRetry={() => navigation.replace('OrderTracking', { orderId })} />;
  }
  if (!order) return null;

  const currentIdx  = TIMELINE.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const badgeStyle  = STATUS_BADGE[order.status] || STATUS_BADGE.placed;
  const eta         = ETA_MINUTES[order.status] ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order #{formatOrderId(orderId)}</Text>
          <Text style={styles.headerSub}>{order.restaurant?.name || 'Your order'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        {/* Status hero card */}
        {isCancelled ? (
          <View style={[styles.heroCard, styles.cancelledCard]}>
            <Ionicons name="close-circle" size={40} color={COLORS.errorText} />
            <Text style={styles.cancelledTitle}>Order cancelled</Text>
            <Text style={styles.cancelledSub}>Sorry, this order was cancelled.</Text>
          </View>
        ) : (
          <View style={styles.heroCard}>
            {isDelivered ? (
              <View style={styles.deliveredIcon}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.successText} />
              </View>
            ) : (
              <View style={styles.pulseWrap}>
                <View style={styles.pulseOuter} />
                <View style={styles.pulseDot}>
                  <Ionicons
                    name={order.status === 'on_the_way' ? 'bicycle' : 'flame'}
                    size={22}
                    color={COLORS.activeOrange}
                  />
                </View>
              </View>
            )}

            <Text style={styles.statusHeading}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
            <Text style={styles.statusMessage}>
              {STATUS_MESSAGES[order.status] || ''}
            </Text>

            {eta > 0 && (
              <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={14} color={COLORS.activeOrange} />
                <Text style={styles.etaText}>~{eta} min estimated</Text>
              </View>
            )}

            {/* 6-stage status bar */}
            <OrderStatusBar status={order.status} style={{ marginTop: SPACING.xl }} />
          </View>
        )}

        {/* Order total */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Order total</Text>
            <Text style={styles.cardValue}>{formatMoney(order.total)}</Text>
          </View>
          {order.paymentMethod && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Payment</Text>
              <View style={styles.payBadge}>
                <Ionicons name="phone-portrait-outline" size={13} color={COLORS.activeOrange} />
                <Text style={styles.payBadgeText}>{order.paymentMethod}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Live rider card — shows when on_the_way */}
        {order.status === 'on_the_way' && (
          <View style={styles.riderCard}>
            <LinearGradient
              colors={[COLORS.dark, '#16213e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.riderGradient}
            >
              <View style={styles.riderIcon}>
                <Ionicons name="bicycle" size={24} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.riderTitle}>
                  {order.rider?.name || 'Your rider'}
                </Text>
                <Text style={styles.riderSub}>
                  {riderLoc
                    ? `${riderLoc.lat.toFixed(4)}, ${riderLoc.lng.toFixed(4)}`
                    : 'Heading your way'}
                </Text>
              </View>
              {order.rider?.phone && (
                <TouchableOpacity
                  accessibilityLabel="Call rider"
                  style={styles.callBtn}
                >
                  <Ionicons name="call-outline" size={18} color={COLORS.orange} />
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Delivery address */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.activeOrange} />
              <Text style={[styles.cardLabel, { flex: 1 }]}>
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : [order.deliveryAddress.street, order.deliveryAddress.area, order.deliveryAddress.city]
                      .filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName}>{item.name || item.menuItem?.name || 'Item'}</Text>
              <Text style={styles.itemPrice}>
                {formatMoney((item.price || item.menuItem?.price || 0) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Reorder or chat CTA */}
        {isDelivered && (
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeTab')}
            accessibilityLabel="Order again"
            style={styles.reorderBtn}
            activeOpacity={0.85}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.reorderGradient}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.reorderText}>Order again</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop:        52,
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.sm, marginTop: 2 },

  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.xl,
    marginBottom:    SPACING.md,
    alignItems:      'center',
    ...SHADOW.md,
  },
  cancelledCard: { borderWidth: 1.5, borderColor: COLORS.errorText },
  cancelledTitle:{ color: COLORS.errorText, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.sm },
  cancelledSub:  { color: COLORS.textMuted, marginTop: SPACING.xs },

  deliveredIcon: { marginBottom: SPACING.sm },
  pulseWrap:     { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  pulseOuter: {
    position:        'absolute',
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: 'rgba(255,107,0,0.12)',
  },
  pulseDot: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255,107,0,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  statusHeading: {
    fontSize:   FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color:      COLORS.dark,
    marginTop:  SPACING.sm,
    textAlign:  'center',
  },
  statusMessage: {
    color:     COLORS.textMuted,
    fontSize:  FONT_SIZE.base,
    marginTop: SPACING.xs,
    textAlign: 'center',
    lineHeight:20,
  },
  etaBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.xs,
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderRadius:    RADIUS.pill,
    paddingHorizontal:SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop:       SPACING.md,
  },
  etaText: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg,
                  marginBottom: SPACING.md, ...SHADOW.sm },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  cardLabel:    { color: COLORS.textBody, fontSize: FONT_SIZE.base, flex: 1 },
  cardValue:    { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  payBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: RADIUS.pill,
                  paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  payBadgeText: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm,
                  textTransform: 'capitalize' },

  riderCard: { borderRadius: RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden', ...SHADOW.md },
  riderGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  riderIcon: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: 'rgba(255,107,0,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  riderTitle: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  riderSub:   { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm, marginTop: 2 },
  callBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    borderWidth:     1,
    borderColor:     'rgba(255,107,0,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, marginBottom: SPACING.md },
  itemRow:   { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xs },
  itemQty:   { width: 32, color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold },
  itemName:  { flex: 1, color: COLORS.textBody },
  itemPrice: { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold },

  reorderBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  reorderGradient: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    paddingVertical:SPACING.lg,
  },
  reorderText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
});
