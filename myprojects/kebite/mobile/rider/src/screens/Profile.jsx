import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatPhone, isValidTzPhone } from '../../../shared/formatters';
import api from '../../../shared/api';
import { useAuth } from '../context/AuthContext';
import { disconnectSocket } from '../../../shared/socket';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

const VEHICLE_ICONS = {
  motorcycle: 'bicycle',
  bicycle:    'bicycle-outline',
  car:        'car-outline',
};

export default function Profile({ navigation }) {
  const { user, logout, setUser } = useAuth();

  const [riderData,   setRiderData]   = useState(null);
  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [editOpen,    setEditOpen]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState({ name: '', phone: '' });
  const [formErr,     setFormErr]     = useState({});
  const [toggling,    setToggling]    = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/rider/me'),
        api.get('/rider/analytics'),
      ]);
      setRiderData(pRes.data);
      setAnalytics(aRes.data);
    } catch {
      // silently fall back to auth context user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const rider        = riderData || user;
  const isAvailable  = rider?.isAvailable ?? false;
  const initials     = (rider?.name || 'R').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  function openEdit() {
    setForm({ name: rider?.name || '', phone: rider?.phone || '' });
    setFormErr({});
    setEditOpen(true);
  }

  async function saveEdit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (form.phone && !isValidTzPhone(form.phone)) errs.phone = 'Enter a valid Tanzanian phone number.';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        name:  form.name.trim(),
        phone: form.phone ? formatPhone(form.phone) : undefined,
      });
      setRiderData((prev) => ({ ...prev, ...res.data }));
      if (setUser) setUser((prev) => ({ ...prev, ...res.data }));
      setEditOpen(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability() {
    if (toggling) return;
    setToggling(true);
    const next = !isAvailable;
    try {
      await api.put('/rider/me/availability', { isAvailable: next });
      setRiderData((prev) => ({ ...prev, isAvailable: next }));
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          try { disconnectSocket(); } catch {}
          try { await logout(); } catch {}
          navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{rider?.name || 'Rider'}</Text>
        <Text style={styles.phone}>{rider?.phone ? formatPhone(rider.phone) : rider?.email || ''}</Text>

        {/* Availability badge */}
        <TouchableOpacity
          onPress={toggleAvailability}
          disabled={toggling}
          style={[styles.badge, isAvailable ? styles.badgeOnline : styles.badgeOffline]}
          accessibilityLabel={isAvailable ? 'Go offline' : 'Go online'}
        >
          {toggling
            ? <ActivityIndicator size="small" color={isAvailable ? COLORS.successText : COLORS.textMuted} />
            : <>
                <View style={[styles.badgeDot, { backgroundColor: isAvailable ? COLORS.successText : COLORS.textMuted }]} />
                <Text style={[styles.badgeText, { color: isAvailable ? COLORS.successText : COLORS.textMuted }]}>
                  {isAvailable ? 'Online' : 'Offline'}
                </Text>
              </>
          }
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        {analytics && (
          <View style={styles.statsRow}>
            <StatCell icon="bicycle-outline" label="Total trips" value={analytics.totalDeliveries ?? 0} />
            <View style={styles.statsDivider} />
            <StatCell icon="star-outline"    label="Avg rating"  value={(analytics.avgRating ?? 0).toFixed(1)} />
            <View style={styles.statsDivider} />
            <StatCell icon="today-outline"   label="Today"       value={analytics.todayDeliveries ?? 0} unit="trips" />
          </View>
        )}

        {/* Info section */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          <InfoRow icon="person-outline"     label="Name"    value={rider?.name || '—'} />
          <InfoRow icon="call-outline"       label="Phone"   value={rider?.phone ? formatPhone(rider.phone) : '—'} />
          <InfoRow icon="mail-outline"       label="Email"   value={rider?.email || '—'} />
          {rider?.vehicleType && (
            <InfoRow
              icon={VEHICLE_ICONS[rider.vehicleType] || 'bicycle-outline'}
              label="Vehicle"
              value={rider.vehicleType.charAt(0).toUpperCase() + rider.vehicleType.slice(1)}
            />
          )}
        </View>

        {/* Edit button */}
        <TouchableOpacity onPress={openEdit} style={styles.editBtn} accessibilityLabel="Edit profile">
          <Ionicons name="create-outline" size={18} color={NAVY} />
          <Text style={styles.editText}>Edit profile</Text>
        </TouchableOpacity>

        {/* Actions */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <ActionRow icon="help-circle-outline" label="Help & support"   onPress={() => Alert.alert('Support', 'Call 0800-KEBITE for support.')} />
          <View style={styles.rowDivider} />
          <ActionRow icon="document-text-outline" label="Terms of service" onPress={() => Alert.alert('Terms', 'Visit kebite.co.tz/terms')} />
        </View>

        <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn} accessibilityLabel="Sign out">
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit modal ── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit profile</Text>

            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={[styles.input, formErr.name && styles.inputErr]}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Your name"
              autoCapitalize="words"
              returnKeyType="next"
            />
            {formErr.name && <Text style={styles.fieldErr}>{formErr.name}</Text>}

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={[styles.input, formErr.phone && styles.inputErr]}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+255 7XX XXX XXX"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            {formErr.phone && <Text style={styles.fieldErr}>{formErr.phone}</Text>}

            <View style={styles.sheetActions}>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} disabled={saving} style={styles.saveBtn}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCell({ icon, label, value, unit }) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={20} color={COLORS.orange} />
      <Text style={styles.statVal}>{value}{unit ? ` ${unit}` : ''}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={COLORS.orange} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionRow}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop:     56,
    paddingBottom:  SPACING.xl,
    alignItems:     'center',
    gap:            SPACING.xs,
  },
  avatarWrap: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.sm,
  },
  avatarText: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  name:       { color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  phone:      { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.sm },

  badge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    paddingHorizontal:SPACING.md,
    paddingVertical:  6,
    borderRadius:     RADIUS.pill,
    marginTop:        SPACING.sm,
    borderWidth:      1,
  },
  badgeOnline:  { backgroundColor: COLORS.successBg, borderColor: COLORS.successText },
  badgeOffline: { backgroundColor: '#f3f4f6',         borderColor: COLORS.textLight },
  badgeDot:     { width: 7, height: 7, borderRadius: 4 },
  badgeText:    { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  body: { padding: SPACING.lg, paddingBottom: 80 },

  statsRow: {
    flexDirection:    'row',
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.xl,
    paddingVertical:  SPACING.md,
    marginBottom:     SPACING.xl,
    ...SHADOW.sm,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statVal:  { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, marginTop: 4 },
  statLabel:{ color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  statsDivider: { width: 1, backgroundColor: COLORS.border },

  sectionLabel: {
    color:        COLORS.textMuted,
    fontSize:     FONT_SIZE.xs,
    fontWeight:   FONT_WEIGHT.semibold,
    textTransform:'uppercase',
    letterSpacing:0.6,
    marginBottom: SPACING.sm,
    marginTop:    SPACING.xl,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    overflow:        'hidden',
    ...SHADOW.sm,
  },
  infoRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal:SPACING.md,
    paddingVertical:  SPACING.md,
    gap:              SPACING.md,
    borderBottomWidth:1,
    borderBottomColor:COLORS.border,
  },
  infoLabel:  { color: COLORS.textMuted, flex: 1, fontSize: FONT_SIZE.sm },
  infoValue:  { color: COLORS.dark, fontWeight: FONT_WEIGHT.medium, fontSize: FONT_SIZE.sm, maxWidth: '55%' },

  editBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              SPACING.sm,
    backgroundColor:  COLORS.cardBg,
    borderRadius:     RADIUS.xl,
    paddingVertical:  SPACING.md,
    marginTop:        SPACING.sm,
    borderWidth:      1,
    borderColor:      NAVY,
    ...SHADOW.sm,
  },
  editText: { color: NAVY, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },

  actionRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal:SPACING.md,
    paddingVertical:  SPACING.md,
    gap:              SPACING.md,
  },
  actionLabel:{ color: COLORS.textBody, flex: 1, fontSize: FONT_SIZE.base },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  logoutBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              SPACING.sm,
    marginTop:        SPACING.xxl,
    paddingVertical:  SPACING.md,
  },
  logoutText: { color: COLORS.red, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },

  /* Edit modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding:         SPACING.xl,
    paddingBottom:   40,
  },
  sheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLORS.border,
    alignSelf:       'center',
    marginBottom:    SPACING.lg,
  },
  sheetTitle: {
    color:        COLORS.dark,
    fontSize:     FONT_SIZE.xl,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
  fieldLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor: COLORS.pageBg,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingHorizontal:SPACING.md,
    paddingVertical: SPACING.md,
    fontSize:        FONT_SIZE.base,
    color:           COLORS.dark,
  },
  inputErr:  { borderColor: COLORS.red },
  fieldErr:  { color: COLORS.red, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },

  sheetActions: {
    flexDirection:  'row',
    gap:            SPACING.md,
    marginTop:      SPACING.xl,
  },
  cancelBtn: {
    flex:          1,
    paddingVertical:SPACING.md,
    borderRadius:  RADIUS.xl,
    alignItems:    'center',
    borderWidth:   1,
    borderColor:   COLORS.border,
  },
  cancelText: { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  saveBtn: {
    flex:            1,
    paddingVertical: SPACING.md,
    borderRadius:    RADIUS.xl,
    alignItems:      'center',
    backgroundColor: NAVY,
  },
  saveText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
});
