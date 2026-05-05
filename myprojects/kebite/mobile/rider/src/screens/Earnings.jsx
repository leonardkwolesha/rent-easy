import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator,
         RefreshControl, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import ErrorCard from '../components/ErrorCard';

function dayKey(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}
function dayLabel(key) {
  const d = new Date(key);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Earnings() {
  const [data, setData]         = useState({ today: 0, week: 0, month: 0, deliveries: [] });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [refreshing, setRefresh]= useState(false);

  const fetchEarnings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/users/me/earnings');
      setData(res.data || { today: 0, week: 0, month: 0, deliveries: [] });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load earnings.');
    } finally {
      setLoading(false); setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const dailyBreakdown = useMemo(() => {
    const map = new Map();
    (data.deliveries || []).forEach((d) => {
      const k = dayKey(d.deliveredAt || d.createdAt || Date.now());
      const cur = map.get(k) || { key: k, total: 0, count: 0 };
      cur.total += Number(d.fee || 0);
      cur.count += 1;
      map.set(k, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [data.deliveries]);

  function withdraw() {
    if ((data.week || 0) <= 0) {
      Alert.alert('Nothing to withdraw', 'Your balance is empty.');
      return;
    }
    Alert.alert('Withdraw', `Send ${formatMoney(data.week)} to your M-Pesa wallet?`);
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>This week</Text>
        <Text style={styles.weekAmount}>{formatMoney(data.week)}</Text>

        <TouchableOpacity onPress={withdraw} accessibilityLabel="Withdraw" style={styles.withdrawBtn}>
          <Ionicons name="cash-outline" size={16} color={BRAND.dark} />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.summary}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Today</Text>
          <Text style={styles.cellValue}>{formatMoney(data.today)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>This week</Text>
          <Text style={styles.cellValue}>{formatMoney(data.week)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>This month</Text>
          <Text style={styles.cellValue}>{formatMoney(data.month || data.week * 4)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Daily breakdown</Text>

      {loading ? (
        <ActivityIndicator color={BRAND.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchEarnings} />
      ) : (
        <FlatList
          data={dailyBreakdown}
          keyExtractor={(d) => d.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchEarnings(); }} tintColor={BRAND.orange} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{dayLabel(item.key)}</Text>
                <Text style={styles.rowSub}>{item.count} deliver{item.count === 1 ? 'y' : 'ies'}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatMoney(item.total)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
              No deliveries yet.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.pageBg },
  header:    { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  title:     { color: '#fff', fontSize: 22, fontWeight: '700' },
  subtitle:  { color: '#fff', opacity: 0.85, marginTop: 8, fontSize: 13 },
  weekAmount:{ color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                 backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
                 borderRadius: BRAND.pillRadius, marginTop: 14 },
  withdrawText:{ color: BRAND.dark, fontWeight: '700', fontSize: 13 },
  summary:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
               marginTop: -16, borderRadius: BRAND.cardRadius, paddingVertical: 14,
               borderColor: BRAND.cardBorder, borderWidth: 1, ...BRAND.cardShadow },
  cell:      { flex: 1, alignItems: 'center' },
  divider:   { width: 1, backgroundColor: '#eee' },
  cellLabel: { color: '#888', fontSize: 12 },
  cellValue: { color: BRAND.dark, fontSize: 15, fontWeight: '700', marginTop: 4 },
  sectionTitle: { color: BRAND.dark, fontWeight: '700', fontSize: 14,
                  marginTop: 18, marginHorizontal: 16, marginBottom: 8 },
  row:       { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius, padding: 14,
               marginBottom: 8, flexDirection: 'row', alignItems: 'center',
               borderColor: BRAND.cardBorder, borderWidth: 1 },
  rowTitle:  { color: BRAND.dark, fontWeight: '600' },
  rowSub:    { color: '#888', fontSize: 12, marginTop: 2 },
  rowAmount: { color: BRAND.orange, fontWeight: '700', fontSize: 15 },
});
