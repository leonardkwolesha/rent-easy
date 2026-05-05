import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId, formatPhone } from '../../../shared/formatters';
import OrderStatusBar from '../../../shared/components/OrderStatusBar';
import api from '../../../shared/api';
import { getSocket } from '../../../shared/socket';
import ErrorCard from '../components/ErrorCard';

const NEXT_STATUS = {
  placed:    'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};
const NEXT_LABEL = {
  placed:    'Accept order',
  confirmed: 'Start preparing',
  preparing: 'Mark as Ready',
};
const NEXT_ICON = {
  placed:    'checkmark-circle-outline',
  confirmed: 'flame-outline',
  preparing: 'bag-check-outline',
};

export default function OrderDetail({ route, navigation }) {
  const { orderId }              = route.params;
  const [order, setOrder]        = useState(null);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState(null);
  const [updating, setUpdating]  = useState(false);

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
    })();
    return () => { active = false; };
  }, [orderId]);

  async function advance() {
    const next = NEXT_STATUS[order?.status];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: next });
      setOrder(res.data);
      const s = getSocket();
      if (s?.connected) s.emit('order:statusUpdate', { orderId, status: next });
    } catch (err) {
      Alert.alert('Update failed', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  }

  function confirmCancel() {
    Alert.alert(
      'Cancel order',
      'Are you sure you want to cancel this order? The customer will be notified.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel order', style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
              setOrder(res.data);
              const s = getSocket();
              if (s?.connected) s.emit('order:statusUpdate', { orderId, status: 'cancelled' });
            } catch (err) {
              Alert.alert('Failed', err?.response?.data?.message || 'Could not cancel.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }
  if (error) {
    return <ErrorCard message={error} onRetry={() => navigation.replace('OrderDetail', { orderId })} />;
  }
  if (!order) return null;

  const canAdvance   = !!NEXT_STATUS[order.status];
  const canCancel    = !['delivered', 'cancelled', 'on_the_way', 'ready'].includes(order.status);
  const isCancelled  = order.status === 'cancelled';

  const subtotal = (order.items || []).reduce((s, i) => s + (i.price || i.menuItem?.price || 0) * (i.quantity || 1), 0);
  const fee      = order.deliveryFee || 0;
  const total    = order.total ?? subtotal + fee;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order #{formatOrderId(orderId)}</Text>
          {order.createdAt && (
            <Text style={styles.headerTime}>
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 160 }}>
        {/* 6-stage status bar */}
        <View style={styles.statusCard}>
          <OrderStatusBar status={order.status} />
          {isCancelled && (
            <View style={styles.cancelBanner}>
              <Ionicons name="close-circle" size={16} color={COLORS.errorText} />
              <Text style={styles.cancelText}>This order was cancelled</Text>
            </View>
          )}
        </View>

        {/* Customer info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={16} color={COLORS.activeOrange} />
            </View>
            <Text style={styles.infoText}>{order.customer?.name || '—'}</Text>
          </View>
          {order.customer?.phone && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={16} color={COLORS.activeOrange} />
              </View>
              <Text style={styles.infoText}>{formatPhone(order.customer.phone)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={16} color={COLORS.activeOrange} />
            </View>
            <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={3}>
              {order.deliveryAddress || '—'}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {(order.items || []).map((item, i) => {
            const itemPrice = (item.price || item.menuItem?.price || 0) * (item.quantity || 1);
            return (
              <View key={i} style={styles.itemRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantity}×</Text>
                </View>
                <Text style={styles.itemName}>{item.name || item.menuItem?.name || 'Item'}</Text>
                <Text style={styles.itemPrice}>{formatMoney(itemPrice)}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
          </View>
          {fee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery fee</Text>
              <Text style={styles.totalValue}>{formatMoney(fee)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: SPACING.sm }]}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>{formatMoney(total)}</Text>
          </View>
        </View>

        {/* Payment method */}
        {order.paymentMethod && (
          <View style={styles.payCard}>
            <Ionicons
              name={order.paymentMethod === 'cash' ? 'cash-outline' : 'phone-portrait-outline'}
              size={18}
              color={COLORS.activeOrange}
            />
            <Text style={styles.payText}>
              Payment via <Text style={{ fontWeight: FONT_WEIGHT.bold, textTransform: 'capitalize' }}>
                {order.paymentMethod}
              </Text>
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {!isCancelled && (
        <View style={styles.actions}>
          {canAdvance && (
            <TouchableOpacity
              onPress={advance}
              disabled={updating}
              accessibilityLabel={NEXT_LABEL[order.status]}
              activeOpacity={0.88}
              style={{ borderRadius: RADIUS.pill, overflow: 'hidden', marginBottom: SPACING.sm }}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.primaryBtn}>
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={NEXT_ICON[order.status]} size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>{NEXT_LABEL[order.status]}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              onPress={confirmCancel}
              accessibilityLabel="Cancel order"
              style={styles.ghostBtn}
            >
              <Text style={styles.ghostBtnText}>Cancel order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  headerTitle:{ color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerTime: { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.xs, marginTop: 2 },

  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  cancelBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.errorBg,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm,
    marginTop:       SPACING.md,
  },
  cancelText: { color: COLORS.errorText, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },

  card:      { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg,
               marginBottom: SPACING.md, ...SHADOW.sm },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, marginBottom: SPACING.md },

  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  infoIcon: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  infoText: { color: COLORS.textBody, fontSize: FONT_SIZE.base, paddingTop: 4 },

  itemRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  qtyBadge:     { width: 28, height: 22, borderRadius: RADIUS.sm, backgroundColor: COLORS.pageBg,
                  alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  qtyText:      { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  itemName:     { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZE.base },
  itemPrice:    { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold },
  divider:      { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  totalLabel:   { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  totalValue:   { color: COLORS.textBody, fontWeight: FONT_WEIGHT.medium },
  totalLabelBold:{ color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  totalValueBold:{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },

  payCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  payText: { color: COLORS.textBody, fontSize: FONT_SIZE.base },

  actions: {
    position:        'absolute',
    left:            SPACING.lg,
    right:           SPACING.lg,
    bottom:          SPACING.xxl,
  },
  primaryBtn: {
    paddingVertical: SPACING.lg,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  ghostBtn:       { padding: SPACING.md, alignItems: 'center' },
  ghostBtnText:   { color: COLORS.errorText, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
});
