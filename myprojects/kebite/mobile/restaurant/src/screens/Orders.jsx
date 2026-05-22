import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW, tabBar,
} from 'shared/theme';
import { formatMoney, formatOrderId } from 'shared/formatters';
import api from 'shared/api';
import { connectSocket } from 'shared/socket';
import { setItem, KEYS } from 'shared/storage';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

const ACTIVE_STATUSES = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

// Three display sections for the restaurant queue
const SECTIONS = [
  {
    key:      'new',
    label:    'New Orders',
    icon:     'alert-circle',
    statuses: ['placed'],
    urgent:   true,
  },
  {
    key:      'active',
    label:    'In Progress',
    icon:     'flame-outline',
    statuses: ['confirmed', 'preparing'],
    urgent:   false,
  },
  {
    key:      'ready',
    label:    'Ready / On the Way',
    icon:     'checkmark-circle-outline',
    statuses: ['ready', 'on_the_way'],
    urgent:   false,
  },
];

// Per-status visual tokens
const STATUS_CHIP = {
  placed:     { bg: 'rgba(255,107,0,0.12)', text: COLORS.activeOrange, label: 'New'         },
  confirmed:  { bg: 'rgba(37,99,235,0.10)', text: '#2563eb',           label: 'Accepted'    },
  preparing:  { bg: 'rgba(245,158,11,0.12)',text: '#d97706',           label: 'Preparing'   },
  ready:      { bg: 'rgba(22,163,74,0.12)', text: '#16a34a',           label: 'Ready'       },
  on_the_way: { bg: 'rgba(99,102,241,0.12)',text: '#6366f1',           label: 'On the Way'  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Orders({ navigation }) {
  const insets = useSafeAreaInsets();

  const [orders,     setOrders]   = useState([]);
  const [loading,    setLoading]  = useState(false);
  const [error,      setError]    = useState(null);
  const [refreshing, setRef]      = useState(false);
  const socketRef = useRef(null);

  // Content must scroll past the floating tab bar
  const scrollPb = tabBar.height + Math.max(insets.bottom, tabBar.bottomGap) + SPACING.lg;

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res  = await api.get('/restaurant/me/orders');
      const list = res.data || [];
      setOrders(list);
      const activeCount = list.filter((o) => ACTIVE_STATUSES.has(o.status)).length;
      await setItem(KEYS.activeOrderCount, String(activeCount));
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      if (!silent) setLoading(false);
      setRef(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    (async () => {
      const s = await connectSocket();
      socketRef.current = s;
      if (s) s.on('order:statusUpdate', () => fetchOrders(true));
    })();
    return () => {
      if (socketRef.current) socketRef.current.off('order:statusUpdate');
    };
  }, [fetchOrders]);

  const newCount    = orders.filter((o) => o.status === 'placed').length;
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;

  // ── Header ─────────────────────────────────────────────────────────────────
  const Header = (
    <LinearGradient
      colors={[NAVY, NAVY2]}
      style={[styles.header, { paddingTop: insets.top + 16 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>{activeCount} active</Text>
      </View>
      {newCount > 0 && (
        <View style={styles.urgentChip}>
          <Ionicons name="alert-circle" size={14} color="#fff" />
          <Text style={styles.urgentChipText}>{newCount} new</Text>
        </View>
      )}
    </LinearGradient>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.screen}>
        {Header}
        <ActivityIndicator color={COLORS.activeOrange} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        {Header}
        <ErrorCard message={error} onRetry={() => fetchOrders()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {Header}

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: scrollPb }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRef(true); fetchOrders(); }}
            tintColor={COLORS.activeOrange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => {
          const list = orders.filter((o) => section.statuses.includes(o.status));
          const hasOrders = list.length > 0;

          return (
            <View key={section.key} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHead}>
                <View style={[
                  styles.sectionIconWrap,
                  section.urgent && hasOrders && { backgroundColor: 'rgba(255,107,0,0.12)' },
                ]}>
                  <Ionicons
                    name={section.icon}
                    size={15}
                    color={section.urgent && hasOrders ? COLORS.activeOrange : COLORS.textMuted}
                  />
                </View>
                <Text style={[
                  styles.sectionLabel,
                  section.urgent && hasOrders && { color: COLORS.activeOrange },
                ]}>
                  {section.label}
                </Text>
                <View style={[
                  styles.countPill,
                  hasOrders && section.urgent && { backgroundColor: COLORS.activeOrange },
                ]}>
                  <Text style={[
                    styles.countText,
                    hasOrders && section.urgent && { color: '#fff' },
                  ]}>
                    {list.length}
                  </Text>
                </View>
              </View>

              {/* Cards or empty state */}
              {!hasOrders ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>No orders here</Text>
                </View>
              ) : (
                list.map((order) => {
                  const chip = STATUS_CHIP[order.status] || STATUS_CHIP.placed;
                  return (
                    <TouchableOpacity
                      key={order._id}
                      onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                      accessibilityLabel={`Open order ${formatOrderId(order._id)}`}
                      style={[styles.card, section.urgent && styles.cardUrgent]}
                      activeOpacity={0.84}
                    >
                      {/* Top: order ID + total */}
                      <View style={styles.cardTop}>
                        <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                        <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                      </View>

                      {/* Customer + item count */}
                      <Text style={styles.customer} numberOfLines={1}>
                        {order.userId?.name || 'Customer'}
                        {' · '}
                        {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                      </Text>

                      {/* Footer: status chip + time */}
                      <View style={styles.cardFooter}>
                        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                          <Text style={[styles.statusChipText, { color: chip.text }]}>
                            {chip.label}
                          </Text>
                        </View>
                        <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
  },
  title:    { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs, marginTop: 2 },

  urgentChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   COLORS.activeOrange,
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   4,
  },
  urgentChipText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  section:     { marginBottom: SPACING.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    marginBottom:  SPACING.sm,
  },
  sectionIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.border + '80',
    alignItems:      'center',
    justifyContent:  'center',
  },
  sectionLabel: {
    flex:       1,
    fontSize:   FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color:      COLORS.dark,
  },
  countPill: {
    backgroundColor:   COLORS.border,
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
    minWidth:          28,
    alignItems:        'center',
  },
  countText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textMuted },

  emptySection: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    alignItems:      'center',
    ...SHADOW.sm,
  },
  emptyText: { color: COLORS.textLight, fontSize: FONT_SIZE.sm, fontStyle: 'italic' },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    ...SHADOW.sm,
  },
  cardUrgent: {
    borderWidth: 1.5,
    borderColor: COLORS.activeOrange + '55',
    ...SHADOW.md,
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.xs,
  },
  orderId:  { fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, fontSize: FONT_SIZE.md },
  amount:   { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  customer: { color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },

  cardFooter: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  statusChip: {
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
  },
  statusChipText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  timeAgo: { flex: 1, color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
});
