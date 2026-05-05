import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
         RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, STATUS_LABELS } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import { connectSocket } from '../../../shared/socket';
import { setItem, KEYS } from '../../../shared/storage';
import ErrorCard from '../components/ErrorCard';

const QUEUE_STATUSES = ['placed', 'confirmed', 'preparing', 'ready'];
const ACTIVE = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

export default function Orders({ navigation }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [refreshing, setRef]  = useState(false);
  const socketRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/orders/restaurant');
      const list = res.data || [];
      setOrders(list);
      const activeCount = list.filter((o) => ACTIVE.has(o.status)).length;
      await setItem(KEYS.activeOrderCount, String(activeCount));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    (async () => {
      const s = await connectSocket();
      socketRef.current = s;
      if (s) s.on('order:statusUpdate', fetchOrders);
    })();
    return () => {
      if (socketRef.current) socketRef.current.off('order:statusUpdate', fetchOrders);
    };
  }, [fetchOrders]);

  function bucket(status) { return orders.filter((o) => o.status === status); }

  if (loading && orders.length === 0) {
    return <ActivityIndicator color={BRAND.orange} style={{ marginTop: 80 }} />;
  }
  if (error) return <ErrorCard message={error} onRetry={fetchOrders} />;

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.pageBg }}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {bucket('placed').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bucket('placed').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); fetchOrders(); }} tintColor={BRAND.orange} />}
      >
        {QUEUE_STATUSES.map((status) => {
          const list = bucket(status);
          return (
            <View key={status} style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>
                {STATUS_LABELS[status]} <Text style={styles.count}>· {list.length}</Text>
              </Text>
              {list.length === 0 ? (
                <Text style={styles.emptyText}>None</Text>
              ) : (
                list.map((order) => (
                  <TouchableOpacity
                    key={order._id}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                    accessibilityLabel={`Open order ${formatOrderId(order._id)}`}
                    style={styles.card}
                  >
                    <View style={styles.cardHead}>
                      <Text style={styles.orderId}>#{formatOrderId(order._id)}</Text>
                      <Text style={styles.amount}>{formatMoney(order.total)}</Text>
                    </View>
                    <Text style={styles.customer} numberOfLines={1}>
                      {order.customer?.name || 'Customer'} · {(order.items || []).length} items
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:        { color: '#fff', fontSize: 24, fontWeight: '700' },
  badge:        { position: 'absolute', top: -4, right: -4, backgroundColor: BRAND.red,
                  borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4,
                  alignItems: 'center', justifyContent: 'center' },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.dark, marginBottom: 8 },
  count:        { color: BRAND.orange, fontWeight: '600' },
  emptyText:    { color: '#aaa', fontStyle: 'italic', marginBottom: 8 },
  card:         { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius, padding: 14,
                  marginBottom: 8, borderColor: BRAND.cardBorder, borderWidth: 1 },
  cardHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId:      { fontWeight: '700', color: BRAND.dark, fontSize: 16 },
  amount:       { color: BRAND.orange, fontWeight: '700' },
  customer:     { color: '#666', marginTop: 6 },
});
