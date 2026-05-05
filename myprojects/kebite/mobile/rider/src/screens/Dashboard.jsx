import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Switch,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import { connectSocket } from '../../../shared/socket';
import { useAuth } from '../context/AuthContext';
import ErrorCard from '../components/ErrorCard';

export default function Dashboard({ navigation }) {
  const { user }                          = useAuth();
  const [orders, setOrders]               = useState([]);
  const [stats, setStats]                 = useState({ trips: 0, earned: 0, rating: 5.0 });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [available, setAvailable]         = useState(true);
  const [locationGranted, setLocGranted]  = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders', { params: { status: 'ready' } }),
        api.get('/users/me/today-stats').catch(() => ({ data: null })),
      ]);
      setOrders(ordersRes.data || []);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load data.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    let socket;
    (async () => {
      socket = await connectSocket();
      if (socket) {
        socket.emit('rider:online', { riderId: user?._id });
        socket.on('order:statusUpdate', fetchData);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocGranted(status === 'granted');
    })();
    return () => {
      if (socket) {
        socket.emit('rider:offline', { riderId: user?._id });
        socket.off('order:statusUpdate', fetchData);
      }
    };
  }, [fetchData, user?._id]);

  async function acceptOrder(orderId) {
    try {
      await api.post(`/orders/${orderId}/accept`);
      navigation.navigate('ActiveDelivery', { orderId });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not accept order.');
    }
  }

  function declineOrder(orderId) {
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
  }

  function renderOrderCard({ item }) {
    const fee      = item.deliveryFee || 2000;
    const distance = item.distance ? `${item.distance} km` : '~2.4 km';

    return (
      <View style={styles.orderCard}>
        {/* Fee badge + order ID row */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>#{formatOrderId(item._id)}</Text>
            <Text style={styles.restaurantName}>{item.restaurant?.name || 'Restaurant'}</Text>
          </View>
          <View style={styles.feeBadge}>
            <Text style={styles.feeAmount}>{formatMoney(fee)}</Text>
            <Text style={styles.feeLabel}>delivery fee</Text>
          </View>
        </View>

        {/* Pickup & drop-off */}
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.restaurant?.address || item.restaurant?.name || 'Restaurant'}
            </Text>
          </View>
        </View>
        <View style={[styles.routeRow, { marginTop: SPACING.xs }]}>
          <View style={[styles.routeDot, styles.routeDotDrop]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Drop-off</Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.deliveryAddress || 'Customer location'}
            </Text>
          </View>
        </View>

        {/* Distance chip */}
        <View style={styles.distanceRow}>
          <Ionicons name="navigate-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.distanceText}>{distance}</Text>
          <Text style={styles.distanceDot}>·</Text>
          <Text style={styles.distanceText}>{(item.items || []).length} item{(item.items || []).length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => declineOrder(item._id)}
            accessibilityLabel="Decline delivery"
            style={styles.declineBtn}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => acceptOrder(item._id)}
            accessibilityLabel={`Accept order ${formatOrderId(item._id)}`}
            activeOpacity={0.85}
            style={{ flex: 1, borderRadius: RADIUS.pill, overflow: 'hidden' }}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.acceptBtn}>
              <Ionicons name="bicycle" size={16} color="#fff" />
              <Text style={styles.acceptText}>Accept delivery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Rider';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>Habari, {firstName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, available ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{available ? "You're online" : "You're offline"}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setAvailable((v) => !v)}
          accessibilityLabel={available ? 'Go offline' : 'Go online'}
          style={[styles.availToggle, available ? styles.availOnline : styles.availOffline]}
          activeOpacity={0.88}
        >
          <View style={[styles.availThumb, available && styles.availThumbRight]} />
          <Text style={styles.availLabel}>{available ? 'Online' : 'Offline'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats row — floats over header */}
      <View style={styles.statsCard}>
        <View style={styles.statCell}>
          <Ionicons name="bicycle-outline" size={18} color={COLORS.activeOrange} />
          <Text style={styles.statValue}>{stats.trips}</Text>
          <Text style={styles.statLabel}>Trips today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Ionicons name="cash-outline" size={18} color={COLORS.activeOrange} />
          <Text style={styles.statValue} numberOfLines={1}>{formatMoney(stats.earned)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Ionicons name="star" size={18} color={COLORS.activeOrange} />
          <Text style={styles.statValue}>{(stats.rating ?? 5).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Location warning */}
      {!locationGranted && (
        <View style={styles.locationWarn}>
          <Ionicons name="location-outline" size={16} color={COLORS.warningText} />
          <Text style={styles.locationWarnText}>Enable GPS to receive accurate delivery assignments.</Text>
        </View>
      )}

      {/* Order list */}
      <Text style={styles.sectionTitle}>
        {available ? 'Available deliveries' : 'Go online to see orders'}
      </Text>

      {loading && orders.length === 0 ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchData} />
      ) : !available ? (
        <View style={styles.offlineEmpty}>
          <Ionicons name="moon-outline" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>You're offline</Text>
          <Text style={styles.emptyHint}>Switch online to start receiving delivery requests.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={renderOrderCard}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={COLORS.orange}
            />
          }
          ListEmptyComponent={
            <View style={styles.offlineEmpty}>
              <Ionicons name="receipt-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No deliveries right now</Text>
              <Text style={styles.emptyHint}>Pull down to refresh — orders will appear here when ready.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },
  header: {
    paddingTop:        52,
    paddingBottom:     36,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
  },
  greet:      { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  dotOnline:  { backgroundColor: '#4ade80' },
  dotOffline: { backgroundColor: 'rgba(255,255,255,0.4)' },
  statusText: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm },

  availToggle: {
    width:           88,
    height:          34,
    borderRadius:    RADIUS.pill,
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal:SPACING.xs,
    justifyContent:  'space-between',
  },
  availOnline:  { backgroundColor: '#16a34a' },
  availOffline: { backgroundColor: 'rgba(255,255,255,0.2)' },
  availThumb: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: '#fff',
  },
  availThumbRight: { order: 1 },
  availLabel:      { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, flex: 1, textAlign: 'center' },

  statsCard: {
    flexDirection:   'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal:SPACING.lg,
    marginTop:       -20,
    borderRadius:    RADIUS.xl,
    paddingVertical: SPACING.lg,
    marginBottom:    SPACING.sm,
    ...SHADOW.md,
  },
  statCell:    { flex: 1, alignItems: 'center', gap: SPACING.xs },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  statValue:   { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  statLabel:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center' },

  locationWarn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.warningBg,
    paddingHorizontal:SPACING.lg,
    paddingVertical: SPACING.sm,
    marginHorizontal:SPACING.lg,
    borderRadius:    RADIUS.md,
    marginBottom:    SPACING.sm,
  },
  locationWarnText: { color: COLORS.warningText, fontSize: FONT_SIZE.sm, flex: 1 },

  sectionTitle: {
    color:           COLORS.dark,
    fontWeight:      FONT_WEIGHT.bold,
    fontSize:        FONT_SIZE.md,
    paddingHorizontal:SPACING.lg,
    marginTop:       SPACING.sm,
    marginBottom:    SPACING.sm,
  },

  orderCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
    ...SHADOW.md,
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   SPACING.md,
  },
  orderId:       { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  restaurantName:{ color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: 2 },
  feeBadge: {
    backgroundColor: COLORS.pendingBg,
    borderRadius:    RADIUS.md,
    paddingHorizontal:SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems:      'center',
  },
  feeAmount:{ color: COLORS.pendingText, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  feeLabel: { color: COLORS.pendingText, fontSize: FONT_SIZE.xs },

  routeRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  routeDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.activeOrange, marginTop: 4 },
  routeDotDrop:{ backgroundColor: COLORS.red },
  routeLabel:  { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  routeText:   { color: COLORS.textBody, fontSize: FONT_SIZE.sm },

  distanceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.xs,
    marginTop:     SPACING.sm,
    paddingTop:    SPACING.sm,
    borderTopWidth:1,
    borderTopColor:COLORS.border,
  },
  distanceText:{ color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  distanceDot: { color: COLORS.border },

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
    paddingVertical: SPACING.sm,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.xs,
  },
  acceptText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  offlineEmpty: { alignItems: 'center', marginTop: SPACING.xxxl * 2, paddingHorizontal: SPACING.xxl, gap: SPACING.sm },
  emptyTitle:   { color: COLORS.textBody, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold },
  emptyHint:    { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});
