import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, ScrollView, StyleSheet, Alert, Modal,
  TextInput, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW,
  STATUS_LABELS, BRAND,
} from 'shared/theme';
import { formatMoney, formatOrderId } from 'shared/formatters';
import api from 'shared/api';
import { connectSocket } from 'shared/socket';
import { useCart } from '../context/CartContext';
import { useOrderBadge } from '../navigation/AppNavigator';
import ErrorCard from '../components/ErrorCard';

const FILTERS = ['All', 'Active', 'Delivered', 'Cancelled'];
const ACTIVE_STATUSES = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

const STATUS_COLORS = {
  placed:     { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  confirmed:  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  preparing:  { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  ready:      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  on_the_way: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  delivered:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  cancelled:  { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

export default function Orders({ navigation }) {
  const { reorderItems }  = useCart();
  const { setCount }      = useOrderBadge();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [refreshing, setRef]  = useState(false);
  const [filter, setFilter]   = useState('All');
  const [rateOrder, setRateOrder] = useState(null);
  const socketRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/orders/my');
      const data = res.data || [];
      setOrders(data);
      setCount(data.filter((o) => ACTIVE_STATUSES.has(o.status)).length);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, [setCount]);

  // Refresh every time this tab gains focus (handles post-checkout return)
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // Socket setup — connect once, stay alive while component is mounted
  useEffect(() => {
    (async () => {
      const s = await connectSocket();
      if (s) {
        socketRef.current = s;
        s.on('order:statusUpdate', (payload) => {
          setOrders((prev) => {
            const updated = prev.map((o) =>
              o._id === payload.orderId ? { ...o, status: payload.status } : o
            );
            setCount(updated.filter((o) => ACTIVE_STATUSES.has(o.status)).length);
            return updated;
          });
        });
      }
    })();
    return () => {
      if (socketRef.current) socketRef.current.off('order:statusUpdate');
    };
  }, [setCount]);

  const filtered = useMemo(() => {
    if (filter === 'All')       return orders;
    if (filter === 'Active')    return orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    if (filter === 'Delivered') return orders.filter((o) => o.status === 'delivered');
    if (filter === 'Cancelled') return orders.filter((o) => o.status === 'cancelled');
    return orders;
  }, [orders, filter]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.has(o.status)),
    [orders]
  );

  function handleReorder(order) {
    if (!order.restaurant?._id || !order.items?.length) {
      Alert.alert('Cannot reorder', 'Order details are incomplete.');
      return;
    }
    Alert.alert(
      'Reorder',
      `Add ${order.items.length} item${order.items.length !== 1 ? 's' : ''} from ${order.restaurant?.name || 'this restaurant'} to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to cart',
          onPress: () => {
            reorderItems(order.items, {
              _id:  order.restaurant._id,
              name: order.restaurant.name || 'Restaurant',
            });
            navigation.navigate('HomeTab', {
              screen: 'RestaurantDetail',
              params: { id: order.restaurant._id },
            });
          },
        },
      ]
    );
  }

  function renderActions(order) {
    const isActive = ACTIVE_STATUSES.has(order.status);
    if (isActive) {
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
          style={[styles.actionBtn, styles.actionPrimary]}
          accessibilityLabel="Track order"
        >
          <Ionicons name="navigate" size={14} color="#fff" />
          <Text style={styles.actionPrimaryText}>Track</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'delivered') {
      return (
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity
            onPress={() => handleReorder(order)}
            style={styles.actionGhost}
            accessibilityLabel="Reorder"
          >
            <Ionicons name="refresh-outline" size={14} color={COLORS.textBody} />
            <Text style={styles.actionGhostText}>Reorder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRateOrder(order)}
            style={[styles.actionBtn, styles.actionPrimary]}
            accessibilityLabel="Rate order"
          >
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={styles.actionPrimaryText}>Rate</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => handleReorder(order)}
        style={styles.actionGhost}
        accessibilityLabel="Reorder"
      >
        <Ionicons name="refresh-outline" size={14} color={COLORS.textBody} />
        <Text style={styles.actionGhostText}>Reorder</Text>
      </TouchableOpacity>
    );
  }

  function renderCard({ item }) {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.placed;
    const isActive = ACTIVE_STATUSES.has(item.status);
    return (
      <TouchableOpacity
        onPress={
          isActive
            ? () => navigation.navigate('OrderTracking', { orderId: item._id })
            : undefined
        }
        activeOpacity={isActive ? 0.85 : 1}
        style={[
          styles.card,
          isActive && { borderLeftWidth: 3, borderLeftColor: COLORS.activeOrange },
        ]}
      >
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurant}>{item.restaurant?.name || 'Restaurant'}</Text>
            <Text style={styles.orderId}>#{formatOrderId(item._id)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        {isActive && (
          <View style={styles.activeProgressRow}>
            {['placed', 'confirmed', 'preparing', 'ready', 'on_the_way'].map((s, i, arr) => {
              const idx    = arr.indexOf(item.status);
              const filled = i <= idx;
              return (
                <Fragment key={s}>
                  <View style={[styles.progressDot, filled && styles.progressDotFilled]} />
                  {i < arr.length - 1 && (
                    <View style={[styles.progressLine, filled && i < idx && styles.progressLineFilled]} />
                  )}
                </Fragment>
              );
            })}
          </View>
        )}

        <Text style={styles.itemSummary} numberOfLines={2}>
          {(item.items || []).map((i) => `${i.quantity}× ${i.name || i.menuItem?.name || 'Item'}`).join(', ') || 'No items'}
        </Text>

        <View style={styles.cardFoot}>
          <View>
            <Text style={styles.amount}>{formatMoney(item.total)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          {renderActions(item)}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.title}>My orders</Text>
        {activeOrders.length > 0 && (
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>{activeOrders.length} active</Text>
          </View>
        )}
      </LinearGradient>

      {/* Active order quick-track banner */}
      {activeOrders.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('OrderTracking', { orderId: activeOrders[0]._id })
          }
          activeOpacity={0.88}
          style={styles.activeBanner}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeBannerInner}
          >
            <View style={styles.activeBannerIcon}>
              <Ionicons name="bicycle" size={20} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>
                {activeOrders[0].restaurant?.name || 'Your order'}
              </Text>
              <Text style={styles.activeBannerSub}>
                {STATUS_LABELS[activeOrders[0].status] || 'In progress'} · Tap to track
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}
                  contentContainerStyle={{ paddingHorizontal: SPACING.md }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const count  = f === 'Active'    ? activeOrders.length
                       : f === 'Delivered' ? orders.filter((o) => o.status === 'delivered').length
                       : f === 'Cancelled' ? orders.filter((o) => o.status === 'cancelled').length
                       : null;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              accessibilityLabel={`Filter ${f}`}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
              {count !== null && count > 0 && (
                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, active && { color: COLORS.activeOrange }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && orders.length === 0 ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchOrders} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRef(true); fetchOrders(); }}
              tintColor={COLORS.orange}
            />
          }
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No orders here</Text>
              <Text style={styles.emptyHint}>
                {filter === 'Active'
                  ? 'You have no active orders right now.'
                  : filter === 'Delivered'
                  ? 'No delivered orders yet.'
                  : filter === 'Cancelled'
                  ? 'No cancelled orders.'
                  : 'Your orders will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      <RatingModal
        visible={!!rateOrder}
        order={rateOrder}
        onClose={() => setRateOrder(null)}
        onSubmitted={() => { setRateOrder(null); fetchOrders(); }}
      />
    </View>
  );
}

// ── Rating modal ────────────────────────────────────────────────────────────
function RatingModal({ visible, order, onClose, onSubmitted }) {
  const [stars,   setStars]   = useState(0);
  const [comment, setComment] = useState('');
  const [busy,    setBusy]    = useState(false);

  const s1 = useRef(new Animated.Value(1)).current;
  const s2 = useRef(new Animated.Value(1)).current;
  const s3 = useRef(new Animated.Value(1)).current;
  const s4 = useRef(new Animated.Value(1)).current;
  const s5 = useRef(new Animated.Value(1)).current;
  const starScales = [s1, s2, s3, s4, s5];

  function touchStar(i) {
    setStars(i);
    Animated.sequence([
      Animated.spring(starScales[i - 1], { toValue: 1.4, useNativeDriver: true, speed: 30 }),
      Animated.spring(starScales[i - 1], { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  function reset() { setStars(0); setComment(''); }

  async function submit() {
    if (stars === 0) { Alert.alert('Select rating', 'Please choose 1–5 stars.'); return; }
    setBusy(true);
    try {
      await api.post('/reviews', {
        orderId:      order._id,
        restaurantId: order.restaurant?._id,
        rating:       stars,
        comment:      comment.trim() || undefined,
      });
      reset();
      onSubmitted?.();
    } catch (err) {
      Alert.alert('Could not submit', err?.response?.data?.message || 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.backdrop}>
        <View style={modal.card}>
          <View style={modal.handle} />
          <Text style={modal.title}>Rate your order</Text>
          <Text style={modal.sub}>{order.restaurant?.name || 'Restaurant'}</Text>

          <View style={modal.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => touchStar(i)}
                accessibilityLabel={`${i} star${i !== 1 ? 's' : ''}`}
                hitSlop={8}
              >
                <Animated.View style={{ transform: [{ scale: starScales[i - 1] }] }}>
                  <Ionicons
                    name={i <= stars ? 'star' : 'star-outline'}
                    size={36}
                    color={i <= stars ? '#f59e0b' : COLORS.border}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {stars > 0 && (
            <Text style={modal.ratingLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
            </Text>
          )}

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={300}
            style={modal.input}
            editable={!busy}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <TouchableOpacity
              onPress={() => { reset(); onClose?.(); }}
              disabled={busy}
              style={[modal.btn, modal.btnCancel]}
            >
              <Text style={modal.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={busy || stars === 0}
              style={[modal.btn, modal.btnPrimary, (busy || stars === 0) && { opacity: 0.5 }]}
            >
              {busy
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={modal.btnPrimaryText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  activeDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  activePillText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.xs },

  activeBanner: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  activeBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  activeBannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  activeBannerTitle: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  activeBannerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: FONT_SIZE.xs, marginTop: 2 },

  chipRow: { paddingVertical: SPACING.sm, maxHeight: 52, flexGrow: 0 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 1,
    marginHorizontal: 4, backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.pill, borderColor: COLORS.border, borderWidth: 1,
  },
  chipActive:     { backgroundColor: COLORS.activeOrange, borderColor: COLORS.activeOrange },
  chipText:       { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  chipTextActive: { color: '#fff' },
  chipCount:      { backgroundColor: COLORS.border, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chipCountActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountText:  { color: COLORS.textMuted, fontSize: 10, fontWeight: FONT_WEIGHT.bold },

  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm,
  },
  cardHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurant: { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  orderId:    { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  badge:      { borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderWidth: 1 },
  badgeText:  { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  activeProgressRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: SPACING.sm, marginBottom: SPACING.xs,
  },
  progressDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border, flexShrink: 0 },
  progressDotFilled: { backgroundColor: COLORS.activeOrange },
  progressLine:      { flex: 1, height: 2, backgroundColor: COLORS.border },
  progressLineFilled:{ backgroundColor: COLORS.activeOrange },

  itemSummary: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: SPACING.sm, lineHeight: 18 },
  cardFoot:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  amount:      { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  date:        { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },

  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 1, borderRadius: RADIUS.pill },
  actionPrimary:    { backgroundColor: COLORS.activeOrange },
  actionPrimaryText:{ color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  actionGhost:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 1, borderRadius: RADIUS.pill, borderColor: COLORS.border, borderWidth: 1 },
  actionGhostText:  { color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },

  empty:     { alignItems: 'center', marginTop: 80, gap: SPACING.sm },
  emptyTitle:{ color: COLORS.textBody, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold },
  emptyHint: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: COLORS.cardBg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, paddingBottom: SPACING.xxl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  title:  { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, textAlign: 'center' },
  sub:    { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: 4, marginBottom: SPACING.lg },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  ratingLabel: { textAlign: 'center', color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md, marginBottom: SPACING.md },
  input: {
    backgroundColor: COLORS.pageBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base, color: COLORS.dark, minHeight: 90, textAlignVertical: 'top',
  },
  btn:           { flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.pill, alignItems: 'center' },
  btnCancel:     { backgroundColor: COLORS.pageBg },
  btnCancelText: { color: COLORS.textBody, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  btnPrimary:    { backgroundColor: COLORS.activeOrange },
  btnPrimaryText:{ color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
});
