import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  ActivityIndicator, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import { connectSocket, getSocket } from '../../../shared/socket';
import { setItem, KEYS } from '../../../shared/storage';
import { useAuth } from '../context/AuthContext';
import ErrorCard from '../components/ErrorCard';

const ACTIVE = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

export default function Dashboard({ navigation }) {
  const { user }              = useAuth();
  const [orders, setOrders]   = useState([]);
  const [stats, setStats]     = useState({ ordersToday: 0, revenue: 0, avgPrep: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [refreshing, setRef]  = useState(false);
  const [open, setOpen]       = useState(true);
  const [now, setNow]         = useState(Date.now());
  const socketRef = useRef(null);

  // Live clock so "X min ago" labels update without a refetch
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/restaurant'),
        api.get('/restaurants/me/today-stats').catch(() => ({ data: null })),
      ]);
      const list = ordersRes.data || [];
      setOrders(list);
      const activeCount = list.filter((o) => ACTIVE.has(o.status)).length;
      await setItem(KEYS.activeOrderCount, String(activeCount));
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    (async () => {
      const s = await connectSocket();
      socketRef.current = s;
      if (s) s.on('order:statusUpdate', fetchData);
    })();
    return () => {
      if (socketRef.current) socketRef.current.off('order:statusUpdate', fetchData);
    };
  }, [fetchData]);

  async function updateStatus(orderId, status) {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? res.data : o));
      const s = getSocket();
      if (s?.connected) s.emit('order:statusUpdate', { orderId, status });
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not update status.');
    }
  }

  async function toggleOpen(val) {
    setOpen(val);
    try {
      await api.patch('/restaurants/me/status', { isOpen: val });
    } catch {
      setOpen(!val);
    }
  }

  const incoming  = orders.filter((o) => o.status === 'placed');
  const preparing = orders.filter((o) => ['confirmed', 'preparing'].includes(o.status));
  const ready     = orders.filter((o) => o.status === 'ready');

  const totalRevenue = stats.revenue || orders.reduce((s, o) => s + (o.total || 0), 0);

  if (loading && orders.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }
  if (error) return <ErrorCard message={error} onRetry={fetchData} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{user?.restaurantName || user?.name || 'Restaurant'}</Text>
        </View>
        <View style={styles.toggleWrap}>
          <Text style={styles.toggleLabel}>{open ? 'Open' : 'Closed'}</Text>
          <Switch
            value={open}
            onValueChange={toggleOpen}
            thumbColor="#fff"
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#16a34a' }}
            accessibilityLabel="Toggle restaurant open or closed"
          />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRef(true); fetchData(); }}
            tintColor={COLORS.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats card — floats up over header */}
        <View style={styles.statsCard}>
          <View style={styles.statCell}>
            <Ionicons name="receipt-outline" size={18} color={COLORS.activeOrange} />
            <Text style={styles.statValue}>{stats.ordersToday || orders.length}</Text>
            <Text style={styles.statLabel}>Orders today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Ionicons name="cash-outline" size={18} color={COLORS.activeOrange} />
            <Text style={styles.statValue} numberOfLines={1}>{formatMoney(totalRevenue)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Ionicons name="time-outline" size={18} color={COLORS.activeOrange} />
            <Text style={styles.statValue}>{stats.avgPrep || 18} min</Text>
            <Text style={styles.statLabel}>Avg prep</Text>
          </View>
        </View>

        {/* Incoming orders */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionLeft}>
            {incoming.length > 0 && <View style={styles.urgentDot} />}
            <Text style={styles.sectionTitle}>Incoming</Text>
            <View style={[styles.countBadge, incoming.length > 0 && styles.countBadgeUrgent]}>
              <Text style={[styles.countText, incoming.length > 0 && styles.countTextUrgent]}>
                {incoming.length}
              </Text>
            </View>
          </View>
        </View>

        {incoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.successText} />
            <Text style={styles.emptyText}>No new orders right now.</Text>
          </View>
        ) : (
          incoming.map((order) => (
            <View key={order._id} style={[styles.orderCard, styles.incomingCard]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                accessibilityLabel={`Open order ${formatOrderId(order._id)}`}
              >
                <View style={styles.cardHead}>
                  <View>
                    <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                    <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <View style={styles.amountWrap}>
                    <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                    <Text style={styles.itemCount}>{(order.items || []).length} items</Text>
                  </View>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  <Ionicons name="person-outline" size={13} /> {order.customer?.name || 'Customer'}
                </Text>
                {order.deliveryAddress ? (
                  <Text style={styles.address} numberOfLines={1}>
                    <Ionicons name="location-outline" size={13} /> {order.deliveryAddress}
                  </Text>
                ) : null}
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => updateStatus(order._id, 'cancelled')}
                  style={styles.declineBtn}
                  accessibilityLabel="Decline order"
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateStatus(order._id, 'confirmed')}
                  accessibilityLabel="Accept order"
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: RADIUS.pill, overflow: 'hidden' }}
                >
                  <LinearGradient colors={GRADIENTS.primary} style={styles.acceptBtn}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Preparing */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionLeft}>
            <Ionicons name="flame-outline" size={16} color={COLORS.activeOrange} />
            <Text style={styles.sectionTitle}>Preparing</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{preparing.length}</Text>
            </View>
          </View>
        </View>

        {preparing.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nothing on the stove.</Text>
          </View>
        ) : (
          preparing.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                accessibilityLabel={`Open order ${formatOrderId(order._id)}`}
              >
                <View style={styles.cardHead}>
                  <View>
                    <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                    <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {order.customer?.name || 'Customer'} · {(order.items || []).length} items
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateStatus(order._id, 'ready')}
                accessibilityLabel="Mark order as ready"
                activeOpacity={0.85}
                style={{ borderRadius: RADIUS.pill, overflow: 'hidden', marginTop: SPACING.md }}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.acceptBtn}>
                  <Ionicons name="bag-check-outline" size={16} color="#fff" />
                  <Text style={styles.acceptText}>Mark Ready</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Ready for pickup */}
        {ready.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionLeft}>
                <Ionicons name="bicycle-outline" size={16} color={COLORS.infoText} />
                <Text style={styles.sectionTitle}>Ready for pickup</Text>
                <View style={[styles.countBadge, { backgroundColor: COLORS.infoBg }]}>
                  <Text style={[styles.countText, { color: COLORS.infoText }]}>{ready.length}</Text>
                </View>
              </View>
            </View>
            {ready.map((order) => (
              <TouchableOpacity
                key={order._id}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                accessibilityLabel={`Open order ${formatOrderId(order._id)}`}
                style={[styles.orderCard, styles.readyCard]}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                  <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                </View>
                <Text style={styles.customer}>
                  {order.customer?.name || 'Customer'} · Waiting for rider
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop:        52,
    paddingBottom:     36,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
  },
  title:       { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  subtitle:    { color: 'rgba(255,255,255,0.82)', marginTop: 2, fontSize: FONT_SIZE.sm },
  toggleWrap:  { alignItems: 'center', gap: SPACING.xs },
  toggleLabel: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },

  statsCard: {
    flexDirection:   'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal:SPACING.lg,
    marginTop:       -20,
    borderRadius:    RADIUS.xl,
    paddingVertical: SPACING.lg,
    ...SHADOW.md,
  },
  statCell:    { flex: 1, alignItems: 'center', gap: SPACING.xs },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  statValue:   { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  statLabel:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center' },

  sectionHead: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.sm },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sectionTitle:{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  countBadge:  { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.pill,
                 backgroundColor: COLORS.border },
  countBadgeUrgent: { backgroundColor: COLORS.pendingBg },
  countText:   { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textMuted },
  countTextUrgent: { color: COLORS.pendingText },
  urgentDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.activeOrange },

  orderCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginHorizontal:SPACING.lg,
    marginBottom:    SPACING.sm,
    ...SHADOW.sm,
  },
  incomingCard: { borderLeftWidth: 3, borderLeftColor: COLORS.activeOrange },
  readyCard:    { borderLeftWidth: 3, borderLeftColor: COLORS.infoText },

  cardHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId:   { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  timeAgo:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  amountWrap:{ alignItems: 'flex-end' },
  amount:    { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  itemCount: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  customer:  { color: COLORS.textBody, marginTop: SPACING.sm, fontSize: FONT_SIZE.sm },
  address:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },

  actionRow:  { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  declineBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  declineText:{ color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  acceptBtn:  {
    paddingVertical:  SPACING.sm,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              SPACING.xs,
  },
  acceptText:{ color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  emptyCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginHorizontal:SPACING.lg,
    marginBottom:    SPACING.sm,
    ...SHADOW.sm,
  },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
});
