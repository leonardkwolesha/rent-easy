import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

const FILTERS = ['all', 'pending', 'paid', 'overdue'];

export default function Payments() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = () => api.get('/payments/landlord').then(r => setPayments(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const renderItem = ({ item: p }) => {
    const s = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
    const isOverdue = p.status === 'overdue';
    return (
      <View style={[styles.row, isOverdue && styles.rowOverdue]}>
        <View style={styles.rowLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{p.tenant?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenant}>{p.tenant?.name}</Text>
            <Text style={styles.meta}>{p.period} · {p.property?.title}</Text>
            <Text style={styles.date}>Due {fmtDate(p.dueDate)}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <Text style={[styles.amount, isOverdue && { color: BRAND.danger }]}>{fmtCurrency(p.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{p.status}</Text>
          </View>
          {p.paidDate && <Text style={styles.paidDate}>Paid {fmtDate(p.paidDate)}</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      {/* Summary header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>Total Collected</Text>
          <Text style={styles.headerStatVal}>{fmtCurrency(totalPaid)}</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>Overdue</Text>
          <Text style={[styles.headerStatVal, totalOverdue > 0 && { color: '#FBBF24' }]}>
            {totalOverdue > 0 ? fmtCurrency(totalOverdue) : '—'}
          </Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>Pending</Text>
          <Text style={styles.headerStatVal}>{pendingCount}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const count = f === 'all' ? payments.length : payments.filter(p => p.status === f).length;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterActive]}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, filter === f && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, filter === f && { color: BRAND.primary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={BRAND.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="wallet-outline" size={48} color={BRAND.border} />
              <Text style={{ color: BRAND.muted, marginTop: 12, fontSize: 15 }}>No {filter === 'all' ? '' : filter} payments</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', backgroundColor: BRAND.primary, paddingVertical: 20, paddingHorizontal: 16 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: '500' },
  headerStatVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  filterRow: { flexDirection: 'row', backgroundColor: BRAND.surface, paddingHorizontal: 10, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5, borderColor: BRAND.border },
  filterActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: BRAND.muted },
  filterTextActive: { color: '#fff' },
  filterCount: { backgroundColor: BRAND.bg, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: BRAND.muted },
  row: { backgroundColor: BRAND.surface, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...BRAND.shadow },
  rowOverdue: { borderLeftWidth: 3, borderLeftColor: BRAND.danger },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, marginRight: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.secondary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: BRAND.secondary },
  tenant: { fontSize: 14, fontWeight: '600', color: BRAND.text },
  meta: { fontSize: 12, color: BRAND.muted, marginTop: 1 },
  date: { fontSize: 11, color: BRAND.muted, marginTop: 1 },
  amount: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  paidDate: { fontSize: 10, color: BRAND.muted },
});
