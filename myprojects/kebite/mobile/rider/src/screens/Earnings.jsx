import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Animated,
  RefreshControl, StyleSheet, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW,
} from 'shared/theme';
import { formatMoney, formatOrderId } from 'shared/formatters';
import api from 'shared/api';
import { useAuth } from '../context/AuthContext';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

const PERIODS = ['Today', 'Week', 'Month'];

function skelStyle(w, h, mt = 0) {
  return { width: w, height: h, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: mt };
}

function SkeletonRow() {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [op]);
  return (
    <Animated.View style={[styles.row, { opacity: op }]}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 14, width: '60%', borderRadius: 6, backgroundColor: COLORS.border }} />
        <View style={{ height: 11, width: '40%', borderRadius: 6, backgroundColor: COLORS.border }} />
      </View>
      <View style={{ height: 16, width: 80, borderRadius: 6, backgroundColor: COLORS.border }} />
    </Animated.View>
  );
}

function periodFilter(orders, period) {
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo  = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);
  const cutoff   = period === 'Today' ? today : period === 'Week' ? weekAgo : monthAgo;
  return orders.filter((o) => new Date(o.createdAt) >= cutoff);
}

const WITHDRAW_METHODS = [
  { id: 'mpesa',  label: 'M-Pesa'       },
  { id: 'airtel', label: 'Airtel Money'  },
  { id: 'mixx',   label: 'Mixx by Yas'    },
];

export default function Earnings() {
  const { user } = useAuth();
  const [analytics,     setAnalytics]  = useState(null);
  const [history,       setHistory]    = useState([]);
  const [loading,       setLoading]    = useState(true);
  const [error,         setError]      = useState(null);
  const [refreshing,    setRefresh]    = useState(false);
  const [period,        setPeriod]     = useState('Week');
  const [withdrawOpen,  setWithdrawOpen] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [aRes, hRes] = await Promise.all([
        api.get('/rider/analytics'),
        api.get('/rider/orders/history'),
      ]);
      setAnalytics(aRes.data);
      setHistory(hRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load earnings.');
    } finally {
      setLoading(false); setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => periodFilter(history, period), [history, period]);

  const periodEarnings = useMemo(
    () => filtered.reduce((s, o) => s + (o.deliveryFee || 0), 0),
    [filtered]
  );

  const headerStat = period === 'Today' ? analytics?.todayEarnings
    : period === 'Week'  ? analytics?.weekEarnings
    : periodEarnings;

  function onWithdraw() {
    const bal = headerStat || 0;
    if (bal <= 0) {
      Alert.alert('Nothing to withdraw', 'Your balance is empty.');
      return;
    }
    setWithdrawOpen(true);
  }

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>
              {period === 'Today' ? "Today's earnings" : period === 'Week' ? 'This week' : 'This month'}
            </Text>
            <Text style={styles.headerAmount}>{formatMoney(headerStat || 0)}</Text>
          </View>
          <TouchableOpacity onPress={onWithdraw} style={styles.withdrawBtn} accessibilityLabel="Withdraw">
            <Ionicons name="cash-outline" size={16} color={NAVY} />
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatChip icon="bicycle-outline" label="Today" value={analytics?.todayDeliveries ?? '—'} unit="trips" />
          <StatChip icon="star-outline"    label="Rating" value={analytics?.avgRating?.toFixed(1) ?? '—'} />
          <StatChip icon="layers-outline"  label="Total"  value={analytics?.totalDeliveries ?? '—'} unit="trips" />
        </View>
      </LinearGradient>

      {/* ── Period selector ── */}
      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.tab, period === p && styles.tabActive]}
            accessibilityLabel={p}
          >
            <Text style={[styles.tabText, period === p && styles.tabTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Error ── */}
      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={22} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={loading ? Array.from({ length: 6 }) : filtered}
          keyExtractor={(item, i) => (loading ? String(i) : (item?._id ?? String(i)))}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); fetchAll(true); }}
              tintColor={COLORS.orange}
            />
          }
          renderItem={({ item }) =>
            loading ? <SkeletonRow /> : <DeliveryRow order={item} />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="bicycle-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No deliveries in this period.</Text>
              </View>
            )
          }
        />
      )}

      <WithdrawModal
        visible={withdrawOpen}
        balance={headerStat || 0}
        phone={user?.phone}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={() => { setWithdrawOpen(false); fetchAll(true); }}
      />
    </View>
  );
}

function WithdrawModal({ visible, balance, phone, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [tel,    setTel]    = useState('');
  const [method, setMethod] = useState('mpesa');
  const [busy,   setBusy]   = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(String(Math.max(0, Math.floor(balance))));
      setTel(phone || '');
      setMethod('mpesa');
      setErrMsg('');
      setBusy(false);
    }
  }, [visible]);

  function close() { if (!busy) onClose?.(); }

  async function submit() {
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1000) { setErrMsg('Minimum withdrawal is TSh 1,000'); return; }
    if (!tel.trim())        { setErrMsg('Enter your phone number'); return; }
    setErrMsg(''); setBusy(true);
    try {
      await api.post('/rider/withdraw', { amount: amt, phone: tel.trim(), method });
      const label = WITHDRAW_METHODS.find((m) => m.id === method)?.label || 'mobile money';
      Alert.alert('Withdrawal requested', `TSh ${amt.toLocaleString()} will be sent to your ${label} shortly.`);
      onSuccess?.();
    } catch (err) {
      setErrMsg(err?.response?.data?.message || 'Could not process withdrawal. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={wStyles.backdrop}
      >
        <View style={wStyles.card}>
          <View style={wStyles.handle} />
          <Text style={wStyles.title}>Withdraw Earnings</Text>

          <View style={wStyles.balanceRow}>
            <Text style={wStyles.balanceLabel}>Available balance</Text>
            <Text style={wStyles.balanceAmount}>{formatMoney(balance)}</Text>
          </View>

          <Text style={wStyles.fieldLabel}>AMOUNT (TSh)</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, '')); setErrMsg(''); }}
            placeholder="Enter amount"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            editable={!busy}
            style={wStyles.input}
          />

          <Text style={wStyles.fieldLabel}>PHONE NUMBER</Text>
          <TextInput
            value={tel}
            onChangeText={(v) => { setTel(v); setErrMsg(''); }}
            placeholder="+255 7XX XXX XXX"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            editable={!busy}
            style={wStyles.input}
          />

          <Text style={wStyles.fieldLabel}>PAYMENT METHOD</Text>
          {WITHDRAW_METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[wStyles.methodRow, m.id === WITHDRAW_METHODS[WITHDRAW_METHODS.length - 1].id && { borderBottomWidth: 0 }]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={method === m.id ? COLORS.orange : COLORS.textMuted}
              />
              <Text style={[wStyles.methodLabel, method === m.id && wStyles.methodLabelActive]}>
                {m.label}
              </Text>
              <View style={[wStyles.radio, method === m.id && wStyles.radioActive]}>
                {method === m.id && <View style={wStyles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {errMsg ? <Text style={wStyles.errMsg}>{errMsg}</Text> : null}

          <View style={wStyles.actions}>
            <TouchableOpacity onPress={close} disabled={busy} style={[wStyles.btn, wStyles.btnCancel]}>
              <Text style={wStyles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={busy} style={[wStyles.btn, wStyles.btnPrimary]}>
              {busy
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={wStyles.btnPrimaryText}>Withdraw</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const wStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  title: { color: NAVY, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.md },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(26,26,46,0.06)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  balanceLabel:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  balanceAmount: { color: NAVY, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.xl },
  fieldLabel: {
    color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base, color: NAVY, backgroundColor: COLORS.pageBg,
  },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  methodLabel:       { flex: 1, color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  methodLabelActive: { color: COLORS.orange },
  radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.orange },
  radioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.orange },
  errMsg:    { color: COLORS.red, fontSize: FONT_SIZE.sm, marginTop: SPACING.sm },
  actions:   { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
  btn:       { flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.pill, alignItems: 'center' },
  btnCancel:       { backgroundColor: '#f3f4f6' },
  btnCancelText:   { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  btnPrimary:      { backgroundColor: NAVY },
  btnPrimaryText:  { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
});

function StatChip({ icon, label, value, unit }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.75)" />
      <Text style={styles.chipVal}>{value}{unit ? ` ${unit}` : ''}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function DeliveryRow({ order }) {
  const date = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : '—';
  const time = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="bicycle" size={18} color={COLORS.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {order?.restaurantId?.name || 'Restaurant'}
        </Text>
        <Text style={styles.rowSub}>
          #{formatOrderId(order?._id)} · {date}{time ? `, ${time}` : ''}
        </Text>
      </View>
      <Text style={styles.rowAmount}>{formatMoney(order?.deliveryFee || 0)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop:        52,
    paddingBottom:     SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  headerTop: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   SPACING.lg,
  },
  headerLabel:  { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.sm },
  headerAmount: { color: '#fff', fontSize: 32, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  withdrawBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  '#fff',
    paddingHorizontal:SPACING.md,
    paddingVertical:  8,
    borderRadius:     RADIUS.pill,
    marginTop:        SPACING.xs,
  },
  withdrawText: { color: NAVY, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  statsRow: {
    flexDirection: 'row',
    gap:           SPACING.sm,
  },
  chip: {
    flex:          1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:  RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems:    'center',
    gap:           2,
  },
  chipVal:   { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md, marginTop: 2 },
  chipLabel: { color: 'rgba(255,255,255,0.65)', fontSize: FONT_SIZE.xs },

  tabs: {
    flexDirection:    'row',
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.xl,
    margin:           SPACING.lg,
    padding:          SPACING.xs,
    ...SHADOW.sm,
  },
  tab: {
    flex:            1,
    paddingVertical: SPACING.sm,
    alignItems:      'center',
    borderRadius:    RADIUS.lg,
  },
  tabActive:     { backgroundColor: NAVY },
  tabText:       { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  row: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    gap:             SPACING.md,
    ...SHADOW.sm,
  },
  rowIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  rowTitle:  { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  rowSub:    { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  rowAmount: { color: COLORS.orange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md, flexShrink: 0 },

  emptyState: {
    alignItems:   'center',
    paddingTop:   60,
    gap:          SPACING.md,
  },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZE.base },

  errorCard: {
    margin:          SPACING.lg,
    backgroundColor: COLORS.errorBg,
    borderRadius:    RADIUS.xl,
    padding:         SPACING.lg,
    alignItems:      'center',
    gap:             SPACING.sm,
  },
  errorText: { color: COLORS.errorText, textAlign: 'center', fontSize: FONT_SIZE.sm },
  retryBtn:  { marginTop: SPACING.sm },
  retryText: { color: COLORS.errorText, fontWeight: FONT_WEIGHT.bold },
});
