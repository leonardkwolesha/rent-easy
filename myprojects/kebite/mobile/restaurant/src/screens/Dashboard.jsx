import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, Animated,
  ActivityIndicator, RefreshControl, StyleSheet, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from 'shared/theme';
import { formatMoney, formatOrderId } from 'shared/formatters';
import api from 'shared/api';
import { connectSocket } from 'shared/socket';
import { setItem, KEYS } from 'shared/storage';
import { useAuth } from '../context/AuthContext';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';
const ACTIVE = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

function formatAddr(addr) {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.label, addr.street, addr.area, addr.city].filter(Boolean).join(', ');
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonStats() {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [op]);
  const box = (w) => ({ width: w, height: 16, borderRadius: 6, backgroundColor: COLORS.border });
  return (
    <Animated.View style={[styles.statsCard, { opacity: op }]}>
      {[1, 2, 3, 4].map((k, i) => (
        <View key={k} style={[styles.statCell, i < 3 && styles.statCellBorder, { gap: 8 }]}>
          <View style={box('50%')} />
          <View style={box('75%')} />
        </View>
      ))}
    </Animated.View>
  );
}

// ── Incoming banner ──────────────────────────────────────────────────────────
function IncomingBanner({ order, onAccept, onDecline, accepting }) {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(-140)).current;

  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, [slideY]);

  return (
    <Animated.View style={[styles.banner, { paddingTop: insets.top + 8, transform: [{ translateY: slideY }] }]}>
      <View style={styles.bannerLeft}>
        <Ionicons name="notifications" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>New order #{formatOrderId(order._id)}</Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            {order.userId?.name || 'Customer'} · {formatMoney(order.total)}
          </Text>
        </View>
      </View>
      <View style={styles.bannerActions}>
        <TouchableOpacity onPress={onDecline} style={styles.bannerDecline}>
          <Text style={styles.bannerDeclineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAccept} disabled={accepting} style={styles.bannerAccept}>
          {accepting
            ? <ActivityIndicator size="small" color={NAVY} />
            : <Text style={styles.bannerAcceptText}>Accept</Text>
          }
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function Dashboard({ navigation }) {
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();

  const [orders,     setOrders]     = useState([]);
  const [analytics,  setAnalytics]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefresh]    = useState(false);
  const [isOpen,     setIsOpen]     = useState(true);
  const [openBusy,   setOpenBusy]   = useState(false);
  const [actionBusy, setActionBusy] = useState({});
  const [bannerOrder,setBanner]     = useState(null);
  const knownIds  = useRef(new Set());
  const socketRef = useRef(null);
  const clockId   = useRef(null);
  const [, tick]  = useState(0);

  useEffect(() => {
    clockId.current = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(clockId.current);
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const [ordRes, anaRes] = await Promise.all([
        api.get('/restaurant/me/orders'),
        api.get('/restaurant/me/analytics').catch(() => ({ data: null })),
      ]);
      const list = ordRes.data || [];
      setOrders(list);

      const activeCount = list.filter((o) => ACTIVE.has(o.status)).length;
      await setItem(KEYS.activeOrderCount, String(activeCount));

      const placed   = list.filter((o) => o.status === 'placed');
      const newOrder = placed.find((o) => !knownIds.current.has(o._id));
      if (newOrder) {
        setBanner(newOrder);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
      }
      placed.forEach((o) => knownIds.current.add(o._id));

      if (anaRes.data) setAnalytics(anaRes.data);

      api.get('/restaurant/me')
        .then((r) => setIsOpen(r.data?.isOpen ?? true))
        .catch(() => {});
    } catch (err) {
      console.error('[Dashboard] fetch error:', err?.response?.data ?? err.message);
      if (!silent) setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false); setRefresh(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    (async () => {
      const s = await connectSocket();
      socketRef.current = s;
      if (s) {
        s.emit('join', { userId: user?._id, role: 'restaurant' });
        s.on('order:statusUpdate', () => fetchAll(true));
      }
    })();
    return () => {
      if (socketRef.current) socketRef.current.off('order:statusUpdate');
    };
  }, [fetchAll]);

  async function toggleOpen(val) {
    setOpenBusy(true);
    const prev = isOpen;
    setIsOpen(val);
    try {
      await api.put('/restaurant/me', { isOpen: val });
    } catch {
      setIsOpen(prev);
    } finally {
      setOpenBusy(false);
    }
  }

  async function updateStatus(orderId, status, reason) {
    setActionBusy((b) => ({ ...b, [orderId]: true }));
    try {
      const body = { status };
      if (reason) body.reason = reason;
      const res = await api.put(`/restaurant/me/orders/${orderId}`, body);
      setOrders((prev) => prev.map((o) => o._id === orderId ? res.data : o));
      if (bannerOrder?._id === orderId) setBanner(null);
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setActionBusy((b) => ({ ...b, [orderId]: false }));
    }
  }

  function promptDecline(orderId) {
    Alert.alert('Reason for declining', 'Let the customer know why.', [
      { text: 'Out of stock',  onPress: () => updateStatus(orderId, 'cancelled', 'Out of stock') },
      { text: 'Too busy',      onPress: () => updateStatus(orderId, 'cancelled', 'Too busy') },
      { text: 'Closing soon',  onPress: () => updateStatus(orderId, 'cancelled', 'Closing soon') },
      { text: 'Cancel',        style: 'cancel' },
    ]);
  }

  const incoming  = orders.filter((o) => o.status === 'placed');
  const preparing = orders.filter((o) => ['confirmed', 'preparing'].includes(o.status));
  const ready     = orders.filter((o) => o.status === 'ready');
  const inTransit = orders.filter((o) => o.status === 'on_the_way');

  // Safe-area-aware header height for loading skeleton
  const headerPaddingTop = insets.top + 14;

  if (loading && orders.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
        <LinearGradient colors={[NAVY, NAVY2]} style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>{user?.restaurantName || user?.name || 'Restaurant'}</Text>
          </View>
        </LinearGradient>
        <View style={{ padding: SPACING.lg, marginTop: SPACING.md }}>
          <SkeletonStats />
        </View>
      </View>
    );
  }
  if (error) return <ErrorCard message={error} onRetry={fetchAll} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* New-order banner overlays everything */}
      {bannerOrder && (
        <IncomingBanner
          order={bannerOrder}
          accepting={!!actionBusy[bannerOrder._id]}
          onAccept={() => updateStatus(bannerOrder._id, 'confirmed')}
          onDecline={() => { setBanner(null); promptDecline(bannerOrder._id); }}
        />
      )}

      {/* ── Header ── */}
      <LinearGradient colors={[NAVY, NAVY2]} style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{user?.restaurantName || user?.name || 'Restaurant'}</Text>
        </View>

        {/* Open / Closed toggle */}
        <View style={styles.toggleWrap}>
          {openBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.toggleLabel, { color: isOpen ? '#2ecc71' : '#e63946' }]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
          )}
          <Switch
            value={isOpen}
            onValueChange={toggleOpen}
            disabled={openBusy}
            thumbColor="#fff"
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#16a34a' }}
            accessibilityLabel="Toggle restaurant open or closed"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefresh(true); fetchAll(); }}
            tintColor={COLORS.orange}
            colors={[COLORS.orange]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Metric cards ── */}
        <View style={styles.statsCard}>
          <StatCell icon="receipt-outline" label="Orders today"  value={analytics?.todayOrders ?? orders.length}                                  color="#ff6b00" />
          <StatCell icon="cash-outline"    label="Revenue today" value={formatMoney(analytics?.todayRevenue ?? 0)}                                 color="#ff6b00" />
          <StatCell icon="time-outline"    label="Pending"       value={incoming.length}                                                            color="#f39c12" />
          <StatCell icon="star-outline"    label="Rating"        value={analytics?.avgRating ? analytics.avgRating.toFixed(1) : '—'} isLast         color="#ff6b00" />
        </View>

        {/* ── Top-selling item ── */}
        {analytics?.popularItems?.[0] && (() => {
          const p       = analytics.popularItems[0];
          const raw     = p?.name || p?.menuItem?.name || '';
          const itemName= typeof raw === 'string' && raw.trim() && raw.trim() !== 'undefined'
            ? raw.trim() : null;
          const itemCount = p?.orders ?? p?.count ?? p?.totalOrders ?? 0;
          if (!itemName || !itemCount) return null;
          return (
            <View style={styles.topItem}>
              <Ionicons name="trophy-outline" size={15} color={COLORS.orange} />
              <Text style={styles.topItemText}>
                Top today:{' '}
                <Text style={{ fontWeight: FONT_WEIGHT.bold, color: COLORS.dark }}>{itemName}</Text>
                {' '}· {itemCount} order{itemCount !== 1 ? 's' : ''}
              </Text>
            </View>
          );
        })()}

        {/* ── Incoming ── */}
        <SectionHead label="Incoming" count={incoming.length} type="incoming" />
        {incoming.length === 0 ? (
          <EmptyState icon="notifications-outline" text="No new orders right now" />
        ) : (
          incoming.map((order) => (
            <View key={order._id} style={[styles.orderCard, styles.incomingCard]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                accessibilityLabel={`View order ${formatOrderId(order._id)}`}
              >
                <View style={styles.cardHead}>
                  <View>
                    <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                    <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                    <Text style={styles.itemCount}>{(order.items || []).length} item(s)</Text>
                  </View>
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {order.userId?.name || 'Customer'}
                  {!!formatAddr(order.deliveryAddress) && (
                    <Text style={styles.address}> · {formatAddr(order.deliveryAddress)}</Text>
                  )}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => promptDecline(order._id)}
                  disabled={!!actionBusy[order._id]}
                  style={styles.rejectBtn}
                  accessibilityLabel="Decline order"
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateStatus(order._id, 'confirmed')}
                  disabled={!!actionBusy[order._id]}
                  accessibilityLabel="Accept order"
                  activeOpacity={0.85}
                  style={styles.acceptBtnWrap}
                >
                  <LinearGradient colors={[COLORS.orange, COLORS.red]} style={styles.acceptBtn}>
                    {actionBusy[order._id]
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.acceptText}>Accept</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* ── Preparing ── */}
        <SectionHead label="In Progress" count={preparing.length} type="preparing" />
        {preparing.length === 0 ? (
          <EmptyState icon="flame-outline" text="Nothing on the stove" />
        ) : (
          preparing.map((order) => {
            // confirmed → next step is to start preparing
            // preparing → next step is to mark ready
            const isConfirmed  = order.status === 'confirmed';
            const nextStatus   = isConfirmed ? 'preparing' : 'ready';
            const btnLabel     = isConfirmed ? 'Start Preparing' : 'Mark Ready';
            const btnIcon      = isConfirmed ? 'flame-outline' : 'bag-check-outline';
            const btnColor     = isConfirmed ? COLORS.orange    : '#2980b9';
            const chipBg       = isConfirmed ? 'rgba(249,115,22,0.10)' : 'rgba(245,158,11,0.12)';
            const chipText     = isConfirmed ? COLORS.activeOrange     : '#d97706';
            const chipLabel    = isConfirmed ? 'Accepted'              : 'Preparing';

            return (
              <View key={order._id} style={[styles.orderCard, styles.preparingCard]}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                  accessibilityLabel={`View order ${formatOrderId(order._id)}`}
                >
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                      <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                      {/* Status chip shows the current stage */}
                      <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
                        <Text style={[styles.statusChipText, { color: chipText }]}>{chipLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.customer} numberOfLines={1}>
                    {order.userId?.name || 'Customer'} · {(order.items || []).length} item(s)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => updateStatus(order._id, nextStatus)}
                  disabled={!!actionBusy[order._id]}
                  accessibilityLabel={btnLabel}
                  activeOpacity={0.85}
                  style={[styles.acceptBtnWrap, { marginTop: SPACING.md }]}
                >
                  <View style={[styles.markReadyBtn, { backgroundColor: btnColor }]}>
                    {actionBusy[order._id]
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Ionicons name={btnIcon} size={16} color="#fff" />
                          <Text style={styles.acceptText}>{btnLabel}</Text>
                        </>
                    }
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* ── Ready for pickup ── */}
        <SectionHead label="Ready for pickup" count={ready.length} type="ready" />
        {ready.length === 0 ? (
          <EmptyState icon="bicycle-outline" text="No orders waiting for pickup" />
        ) : (
          ready.map((order) => (
            <TouchableOpacity
              key={order._id}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
              accessibilityLabel={`View order ${formatOrderId(order._id)}`}
              style={[styles.orderCard, styles.readyCard]}
              activeOpacity={0.85}
            >
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                  <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                </View>
                <Text style={styles.amount}>{formatMoney(order.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm }}>
                <PulsingDot />
                <Text style={styles.customer}>Waiting for rider</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ── In Transit ── */}
        <SectionHead label="In Transit" count={inTransit.length} type="transit" />
        {inTransit.length === 0 ? (
          <EmptyState icon="cube-outline" text="No orders in delivery right now" />
        ) : (
          inTransit.map((order) => (
            <TouchableOpacity
              key={order._id}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
              accessibilityLabel={`View order ${formatOrderId(order._id)}`}
              style={[styles.orderCard, styles.transitCard]}
              activeOpacity={0.85}
            >
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                  <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                </View>
                <Text style={styles.amount}>{formatMoney(order.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm }}>
                <Ionicons name="bicycle" size={14} color="#2980b9" />
                <Text style={[styles.customer, { color: '#2980b9' }]}>
                  {order.userId?.name || 'Customer'} · Rider on the way
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Pulsing dot for "Ready" cards ─────────────────────────────────────────────
function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange,
      transform: [{ scale }],
    }} />
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCell({ icon, label, value, isLast, color }) {
  return (
    <View style={[styles.statCell, !isLast && styles.statCellBorder]}>
      <Ionicons name={icon} size={20} color={color || COLORS.activeOrange} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const BADGE_STYLES = {
  incoming:  { bg: '#fff3e0', text: '#ff6b00' },
  preparing: { bg: '#fff0e6', text: '#e63946' },
  ready:     { bg: '#e8f4fd', text: '#2980b9' },
  transit:   { bg: '#e8f4fd', text: '#16a34a' },
};

function SectionHead({ label, count, type }) {
  const badge = BADGE_STYLES[type] || { bg: '#f3f4f6', text: '#888' };
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={[styles.countBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.countText, { color: badge.text }]}>{count}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon, text }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={28} color="#ccc" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom:     20,
    paddingHorizontal: 16,
    flexDirection:     'row',
    alignItems:        'center',
  },
  title:      { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle:   { color: 'rgba(255,255,255,0.6)', marginTop: 2, fontSize: 13 },
  toggleWrap: { alignItems: 'center', gap: 4 },
  toggleLabel:{ fontSize: 12, fontWeight: '600' },

  banner: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    zIndex:            99,
    backgroundColor:   COLORS.orange,
    paddingBottom:     SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    gap:               SPACING.md,
  },
  bannerLeft:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  bannerTitle:       { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  bannerSub:         { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.xs },
  bannerActions:     { flexDirection: 'row', gap: SPACING.sm },
  bannerDecline: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  bannerDeclineText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  bannerAccept: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: '#fff',
  },
  bannerAcceptText: { color: COLORS.orange, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  statsCard: {
    flexDirection:    'row',
    backgroundColor:  '#fff',
    marginHorizontal: 16,
    marginTop:        16,
    marginBottom:     4,
    borderRadius:     16,
    paddingVertical:  16,
    borderWidth:      0.5,
    borderColor:      '#f0f0f0',
    ...SHADOW.sm,
  },
  statCell:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  statCellBorder: { borderRightWidth: 0.5, borderRightColor: '#f0f0f0' },
  statValue:      { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  statLabel:      { fontSize: 10, color: '#999', textAlign: 'center' },

  topItem: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              SPACING.sm,
    backgroundColor:  '#fff',
    borderRadius:     RADIUS.lg,
    marginHorizontal: 16,
    marginTop:        8,
    marginBottom:     4,
    padding:          SPACING.md,
    ...SHADOW.sm,
  },
  topItemText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, flex: 1 },

  sectionHead: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingTop:     18,
    paddingBottom:  8,
    gap:            8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  countBadge:   { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countText:    { fontSize: 12, fontWeight: '700' },

  orderCard: {
    backgroundColor:  '#fff',
    borderRadius:     14,
    padding:          14,
    marginHorizontal: 16,
    marginBottom:     8,
    borderWidth:      0.5,
    borderColor:      '#eee',
    ...SHADOW.sm,
  },
  incomingCard:  { borderLeftWidth: 3, borderLeftColor: '#ff6b00' },
  preparingCard: { borderLeftWidth: 3, borderLeftColor: '#e63946' },
  readyCard:     { borderLeftWidth: 3, borderLeftColor: '#2980b9' },
  transitCard:   { borderLeftWidth: 3, borderLeftColor: '#16a34a' },

  cardHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId:   { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: '#1a1a2e' },
  timeAgo:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  amount:    { color: '#ff6b00', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  itemCount: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  customer:  { color: '#555', marginTop: SPACING.sm, fontSize: FONT_SIZE.sm },
  address:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },

  statusChip: {
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },

  actionRow:    { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  rejectBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e63946',
  },
  rejectText:   { color: '#e63946', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  acceptBtnWrap:{ flex: 1, borderRadius: 10, overflow: 'hidden' },
  acceptBtn: {
    paddingVertical: 10,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.xs,
  },
  acceptText:   { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  markReadyBtn: {
    backgroundColor: '#2980b9',
    borderRadius:    10,
    paddingVertical: 10,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.xs,
  },

  emptyCard: {
    alignItems:       'center',
    paddingVertical:  20,
    marginHorizontal: 16,
    marginBottom:     8,
    gap:              6,
  },
  emptyText: { fontSize: 13, color: '#bbb' },
});
