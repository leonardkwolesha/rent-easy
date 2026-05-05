import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator,
         RefreshControl, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, STATUS_LABELS } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import ErrorCard from '../components/ErrorCard';

const FILTERS = ['All', 'Active', 'Delivered', 'Cancelled'];
const ACTIVE_STATUSES = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

export default function Orders({ navigation }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [refreshing, setRef]  = useState(false);
  const [filter, setFilter]   = useState('All');

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (filter === 'All')        return orders;
    if (filter === 'Active')     return orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    if (filter === 'Delivered')  return orders.filter((o) => o.status === 'delivered');
    if (filter === 'Cancelled')  return orders.filter((o) => o.status === 'cancelled');
    return orders;
  }, [orders, filter]);

  function reorder(order) {
    Alert.alert('Reorder', `Add the ${order.items?.length || 0} items from this order to your cart?`);
  }

  function rate(order) {
    Alert.alert('Rate order', 'Open rating screen.');
  }

  function renderActions(order) {
    if (ACTIVE_STATUSES.has(order.status)) {
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderTracking', { orderId: order._id })}
          style={[styles.actionBtn, styles.actionPrimary]}
          accessibilityLabel="Track order"
        >
          <Ionicons name="navigate-outline" size={14} color="#fff" />
          <Text style={styles.actionPrimaryText}>Track</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'delivered') {
      return (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => reorder(order)} style={styles.actionGhost} accessibilityLabel="Reorder">
            <Text style={styles.actionGhostText}>Reorder</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => rate(order)} style={[styles.actionBtn, styles.actionPrimary]} accessibilityLabel="Rate">
            <Ionicons name="star-outline" size={14} color="#fff" />
            <Text style={styles.actionPrimaryText}>Rate</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity onPress={() => reorder(order)} style={styles.actionGhost} accessibilityLabel="Reorder">
        <Text style={styles.actionGhostText}>Reorder</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.pageBg }}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <Text style={styles.title}>My orders</Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}
                  contentContainerStyle={{ paddingHorizontal: 12 }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              accessibilityLabel={`Filter ${f}`}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && orders.length === 0 ? (
        <ActivityIndicator color={BRAND.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchOrders} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); fetchOrders(); }} tintColor={BRAND.orange} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurant}>{item.restaurant?.name || 'Restaurant'}</Text>
                  <Text style={styles.orderId}>#{formatOrderId(item._id)}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[item.status] || item.status}</Text>
                </View>
              </View>

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
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#bbb" />
              <Text style={{ color: '#888', marginTop: 12 }}>No orders to show.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  title:         { color: '#fff', fontSize: 24, fontWeight: '700' },
  chipRow:       { paddingVertical: 12, maxHeight: 56, flexGrow: 0 },
  chip:          { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4,
                   backgroundColor: '#fff', borderRadius: BRAND.pillRadius,
                   borderColor: BRAND.cardBorder, borderWidth: 1 },
  chipActive:    { backgroundColor: BRAND.orange, borderColor: BRAND.orange },
  chipText:      { color: BRAND.dark, fontWeight: '600', fontSize: 13 },
  chipTextActive:{ color: '#fff' },
  card:          { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius, padding: 14,
                   marginBottom: 10, borderColor: BRAND.cardBorder, borderWidth: 1 },
  cardHead:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurant:    { color: BRAND.dark, fontWeight: '700', fontSize: 15 },
  orderId:       { color: '#888', fontSize: 12, marginTop: 2 },
  badge:         { backgroundColor: '#fff5f0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:     { color: BRAND.orange, fontSize: 11, fontWeight: '700' },
  itemSummary:   { color: '#555', fontSize: 13, marginTop: 8 },
  cardFoot:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  amount:        { color: BRAND.dark, fontWeight: '700', fontSize: 16 },
  date:          { color: '#888', fontSize: 12, marginTop: 2 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4,
                   paddingHorizontal: 14, paddingVertical: 8, borderRadius: BRAND.pillRadius },
  actionPrimary: { backgroundColor: BRAND.activeOrange },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionGhost:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BRAND.pillRadius,
                   borderColor: BRAND.cardBorder, borderWidth: 1 },
  actionGhostText: { color: BRAND.dark, fontWeight: '600', fontSize: 13 },
  empty:         { alignItems: 'center', marginTop: 80 },
});
