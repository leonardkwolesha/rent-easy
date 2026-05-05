import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import { connectSocket } from '../../../shared/socket';
import { setJSON } from '../../../shared/storage';
import { useAuth } from '../context/AuthContext';
import ErrorCard from '../components/ErrorCard';

const NAVY    = '#1a1a2e';
const NAVY2   = '#16213e';
const POLL_MS = 10000;

function formatAddr(loc) {
  if (!loc) return '—';
  if (typeof loc === 'string') return loc;
  return loc.address || [loc.street, loc.area, loc.city].filter(Boolean).join(', ') || '—';
}

// ── Pulsing waiting state ──────────────────────────────────────────────────
function WaitingState() {
  const r1 = useRef(new Animated.Value(1)).current;
  const o1 = useRef(new Animated.Value(0.9)).current;
  const r2 = useRef(new Animated.Value(1)).current;
  const o2 = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const pulse = (scale, opacity, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 2.6, duration: 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.9, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
    const a1 = pulse(r1, o1, 0);
    const a2 = pulse(r2, o2, 600);
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={wait.wrap}>
      <View style={wait.dotWrap}>
        <Animated.View style={[wait.ring, { transform: [{ scale: r1 }], opacity: o1 }]} />
        <Animated.View style={[wait.ring, { transform: [{ scale: r2 }], opacity: o2 }]} />
        <LinearGradient colors={[COLORS.activeOrange, COLORS.red]} style={wait.dot}>
          <Ionicons name="bicycle" size={28} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={wait.title}>Waiting for orders…</Text>
      <Text style={wait.sub}>New deliveries will appear here automatically</Text>
      <Text style={wait.hint}>Refreshing every 10 seconds</Text>
    </View>
  );
}
const wait = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxl * 2 },
  dotWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  ring: {
    position: 'absolute', width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(232,82,26,0.22)',
  },
  dot:   { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.dark, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  sub:   { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20, paddingHorizontal: SPACING.xl },
  hint:  { color: COLORS.textLight, fontSize: FONT_SIZE.xs, marginTop: SPACING.sm },
});

// ── Main screen ────────────────────────────────────────────────────────────
export default function Dashboard({ navigation }) {
  const { user } = useAuth();

  const [orders,     setOrders]     = useState([]);
  const [stats,      setStats]      = useState({ todayEarnings: 0, todayDeliveries: 0, avgRating: 5.0, totalDeliveries: 0 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [available,  setAvailable]  = useState(user?.isAvailable ?? true);
  const [locGranted, setLocGranted] = useState(false);
  const [accepting,  setAccepting]  = useState(null);

  const pulseAnims = useRef({});
  const newIds     = useRef(new Set());
  const socketRef  = useRef(null);
  const pollRef    = useRef(null);

  function getPulse(id) {
    if (!pulseAnims.current[id]) pulseAnims.current[id] = new Animated.Value(1);
    return pulseAnims.current[id];
  }

  function animateNewCard(id) {
    const anim = getPulse(id);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.03, useNativeDriver: true, speed: 30 }),
      Animated.spring(anim, { toValue: 1,    useNativeDriver: true, speed: 30 }),
      Animated.spring(anim, { toValue: 1.03, useNativeDriver: true, speed: 30 }),
      Animated.spring(anim, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start(() => newIds.current.delete(id));
  }

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const [ordRes, statRes] = await Promise.all([
        api.get('/rider/orders/available'),
        api.get('/rider/analytics').catch(() => ({ data: null })),
      ]);
      const fresh = ordRes.data || [];
      setOrders((prev) => {
        const prevIds = new Set(prev.map((o) => o._id));
        fresh.forEach((o) => {
          if (!prevIds.has(o._id)) {
            newIds.current.add(o._id);
            animateNewCard(o._id);
          }
        });
        return fresh;
      });
      if (statRes.data) setStats(statRes.data);
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Could not load orders. Check your connection.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => fetchData(true), POLL_MS);

    (async () => {
      const s = await connectSocket();
      if (s) {
        socketRef.current = s;
        s.emit('rider:online', { riderId: user?._id });
        s.on('order:statusUpdate', () => fetchData(true));
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocGranted(status === 'granted');
    })();

    return () => {
      clearInterval(pollRef.current);
      if (socketRef.current) {
        socketRef.current.emit('rider:offline', { riderId: user?._id });
        socketRef.current.off('order:statusUpdate');
      }
    };
  }, [fetchData, user?._id]);

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    try {
      await api.put('/rider/me/availability', { isAvailable: next });
    } catch {
      setAvailable(!next);
    }
  }

  async function acceptOrder(orderId) {
    setAccepting(orderId);
    try {
      const res = await api.put(`/rider/orders/${orderId}/accept`);
      const order = res.data;
      await setJSON('kebite_active_delivery', { orderId, order });
      navigation.navigate('ActiveDelivery', { orderId, order });
    } catch (err) {
      Alert.alert('Could not accept', err?.response?.data?.message || 'This order may have been taken.');
      fetchData(true);
    } finally {
      setAccepting(null);
    }
  }

  function declineOrder(orderId) {
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
  }

  function renderCard({ item }) {
    const fee      = item.deliveryFee || 2000;
    const distance = item.distance ? `${item.distance} km` : '~2.4 km';
    const isNew    = newIds.current.has(item._id);
    const pulse    = getPulse(item._id);
    const isBusy   = accepting === item._id;

    return (
      <Animated.View style={[styles.card, { transform: [{ scale: pulse }] }, isNew && styles.cardHighlight]}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurant} numberOfLines={1}>
              {item.restaurantId?.name || 'Restaurant'}
            </Text>
            <Text style={styles.orderId}>#{formatOrderId(item._id)}</Text>
          </View>
          <View style={styles.feeBadge}>
            <Text style={styles.feeAmt}>{formatMoney(fee)}</Text>
            <Text style={styles.feeLbl}>payout</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routeTrack}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.activeOrange }]} />
            <View style={styles.routeConnector} />
            <View style={[styles.routeDot, { backgroundColor: COLORS.red }]} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: SPACING.sm }}>
              <Text style={styles.routeLbl}>PICKUP</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {formatAddr(item.restaurantId?.location)}
              </Text>
            </View>
            <View>
              <Text style={styles.routeLbl}>DROP-OFF</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {formatAddr(item.deliveryAddress)}
              </Text>
            </View>
          </View>
        </View>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="navigate-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaTxt}>{distance}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="cube-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaTxt}>
              {(item.items || []).length} item{(item.items || []).length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaTxt}>~20 min est.</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => declineOrder(item._id)}
            style={styles.declineBtn}
            activeOpacity={0.85}
            accessibilityLabel="Decline delivery"
          >
            <Text style={styles.declineTxt}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => acceptOrder(item._id)}
            disabled={!!accepting}
            activeOpacity={0.85}
            style={{ flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden' }}
            accessibilityLabel={`Accept order ${formatOrderId(item._id)}`}
          >
            <LinearGradient colors={[COLORS.activeOrange, COLORS.red]} style={styles.acceptBtn}>
              {isBusy
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="bicycle" size={17} color="#fff" />
                    <Text style={styles.acceptTxt}>Accept delivery</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Rider';

  return (
    <View style={styles.container}>
      {/* Navy header */}
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>Habari, {firstName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, available ? styles.dotOn : styles.dotOff]} />
            <Text style={styles.statusTxt}>{available ? "You're online" : "You're offline"}</Text>
          </View>
        </View>
        {/* Prominent toggle */}
        <TouchableOpacity
          onPress={toggleAvailability}
          activeOpacity={0.85}
          style={[styles.toggle, available ? styles.toggleOn : styles.toggleOff]}
          accessibilityLabel={available ? 'Go offline' : 'Go online'}
        >
          {available ? (
            <>
              <Text style={styles.toggleLbl}>Online</Text>
              <View style={styles.toggleThumb} />
            </>
          ) : (
            <>
              <View style={styles.toggleThumb} />
              <Text style={styles.toggleLbl}>Offline</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats card floats over header bottom */}
      <View style={styles.statsCard}>
        <StatCell icon="bicycle-outline" label="Today" value={String(stats.todayDeliveries)} />
        <View style={styles.statDiv} />
        <StatCell icon="cash-outline" label="Earned" value={formatMoney(stats.todayEarnings)} />
        <View style={styles.statDiv} />
        <StatCell icon="star" label="Rating" value={(stats.avgRating ?? 5).toFixed(1)} />
      </View>

      {/* GPS warning */}
      {!locGranted && (
        <View style={styles.locWarn}>
          <Ionicons name="location-outline" size={15} color={COLORS.warningText} />
          <Text style={styles.locWarnTxt}>Enable GPS to receive accurate delivery assignments.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {available ? 'Available deliveries' : 'Go online to see orders'}
      </Text>

      {loading && orders.length === 0 ? (
        <ActivityIndicator color={COLORS.activeOrange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={() => fetchData()} />
      ) : !available ? (
        <View style={styles.offlineWrap}>
          <Ionicons name="moon-outline" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>You're offline</Text>
          <Text style={styles.emptyHint}>Switch online to start receiving delivery requests.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={COLORS.activeOrange}
            />
          }
          ListEmptyComponent={<WaitingState />}
        />
      )}
    </View>
  );
}

function StatCell({ icon, label, value }) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={18} color={COLORS.activeOrange} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop: 52, paddingBottom: 36, paddingHorizontal: SPACING.lg,
    flexDirection: 'row', alignItems: 'center',
  },
  greet:     { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  dotOn:     { backgroundColor: '#4ade80' },
  dotOff:    { backgroundColor: 'rgba(255,255,255,0.35)' },
  statusTxt: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm },

  toggle: {
    width: 92, height: 38, borderRadius: RADIUS.pill,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xs, gap: 4,
  },
  toggleOn:    { backgroundColor: '#16a34a' },
  toggleOff:   { backgroundColor: 'rgba(255,255,255,0.18)' },
  toggleThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  toggleLbl:   { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, flex: 1, textAlign: 'center' },

  statsCard: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg, marginTop: -20,
    borderRadius: RADIUS.xl, paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm, ...SHADOW.md,
  },
  statCell:  { flex: 1, alignItems: 'center', gap: SPACING.xs },
  statDiv:   { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center' },

  locWarn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.warningBg, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  locWarnTxt: { color: COLORS.warningText, fontSize: FONT_SIZE.sm, flex: 1 },

  sectionTitle: {
    color: COLORS.dark, fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md, paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm, marginBottom: SPACING.sm,
  },

  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.md,
  },
  cardHighlight: { borderWidth: 2, borderColor: COLORS.activeOrange },

  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  restaurant: { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  orderId:  { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  feeBadge: { backgroundColor: COLORS.pendingBg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, alignItems: 'center' },
  feeAmt:   { color: COLORS.pendingText, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  feeLbl:   { color: COLORS.pendingText, fontSize: FONT_SIZE.xs },

  routeRow:       { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  routeTrack:     { width: 16, alignItems: 'center', paddingVertical: 3 },
  routeDot:       { width: 10, height: 10, borderRadius: 5 },
  routeConnector: { flex: 1, width: 2, backgroundColor: COLORS.border, marginVertical: 3 },
  routeLbl:       { color: COLORS.textMuted, fontSize: 10, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },
  routeAddr:      { color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginTop: 2 },

  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },

  actionRow:  { flexDirection: 'row', gap: SPACING.sm },
  declineBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  declineTxt: { color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  acceptBtn:  { paddingVertical: SPACING.sm + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  acceptTxt:  { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  offlineWrap: { alignItems: 'center', marginTop: SPACING.xxxl * 2, paddingHorizontal: SPACING.xxl, gap: SPACING.sm },
  emptyTitle:  { color: COLORS.textBody, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold },
  emptyHint:   { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});
