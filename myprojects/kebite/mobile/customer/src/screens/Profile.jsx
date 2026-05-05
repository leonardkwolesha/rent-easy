import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Switch, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../shared/api';
import { formatPhone, formatMoney } from '../../../shared/formatters';
import { disconnectSocket } from '../../../shared/socket';
import { useAuth } from '../context/AuthContext';
import {
  COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW,
} from '../../../shared/theme';
import {
  GradientHeader, Avatar, Badge, StatCard,
} from '../../../shared/components';

function memberSince(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function Profile({ navigation }) {
  const { user, logout, setUser } = useAuth();

  // Notification prefs (mirrored from server, optimistic)
  const [prefs, setPrefs] = useState({
    sms:      user?.notificationPrefs?.sms      ?? true,
    email:    user?.notificationPrefs?.email    ?? true,
    whatsapp: user?.notificationPrefs?.whatsapp ?? false,
  });
  const [language, setLanguage] = useState(user?.language ?? 'en');

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs({
        sms:      user.notificationPrefs.sms      ?? true,
        email:    user.notificationPrefs.email    ?? true,
        whatsapp: user.notificationPrefs.whatsapp ?? false,
      });
    }
    if (user?.language) setLanguage(user.language);
  }, [user?._id]);

  // Inline edit state
  const [editing, setEditing] = useState(null); // 'name' | 'phone' | null
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);

  // Password modal
  const [pwOpen, setPwOpen] = useState(false);

  function startEdit(field) {
    setEditing(field);
    setDraft(field === 'phone' ? (user?.phone || '') : (user?.[field] || ''));
  }

  async function commitEdit() {
    if (!editing) return;
    const value = String(draft).trim();
    if (!value) { Alert.alert('Empty', `${editing} can't be empty`); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', { [editing]: value });
      setUser(data);
      setEditing(null);
    } catch (err) {
      Alert.alert('Update failed', err.response?.data?.message || 'Try again');
    } finally {
      setSaving(false);
    }
  }

  async function togglePref(key, next) {
    const prev = prefs;
    setPrefs((p) => ({ ...p, [key]: next })); // optimistic
    try {
      await api.put('/users/me/preferences', { [key]: next });
    } catch (err) {
      setPrefs(prev); // revert
      Alert.alert('Notification', err.response?.data?.message || 'Could not save preference');
    }
  }

  async function changeLanguage(lang) {
    if (lang === language) return;
    const prev = language;
    setLanguage(lang); // optimistic
    try {
      const { data } = await api.put('/users/me', { language: lang });
      setUser(data);
    } catch (err) {
      setLanguage(prev);
      Alert.alert('Language', err.response?.data?.message || 'Could not save language');
    }
  }

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive',
        onPress: async () => { disconnectSocket(); await logout(); } },
    ]);
  }

  function topUp() {
    Alert.alert('Top up wallet', 'Choose your payment method to add funds.');
  }

  const orderCount = user?.orderCount ?? 0;
  const wallet     = user?.walletBalance ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>

        {/* ── Gradient header ────────────────────────────────────────── */}
        <GradientHeader
          title="My Profile"
          topInset={48}
          right={
            <TouchableOpacity onPress={confirmLogout} hitSlop={8} accessibilityLabel="Sign out">
              <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          }
        >
          <View style={styles.heroRow}>
            <Avatar name={user?.name} uri={user?.avatar} size={84} variant="glass" />
            <Text style={styles.heroName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.heroEmail}>{user?.email || ''}</Text>
            <Badge
              label="Kebite Member TZ"
              bg="rgba(255,255,255,0.22)"
              text="#fff"
              size="md"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </GradientHeader>

        {/* ── Stats row (overlaps the header bottom edge) ────────────── */}
        <View style={styles.statsRow}>
          <StatCard compact value={orderCount}                 label="Orders" />
          <View style={{ width: SPACING.sm }} />
          <StatCard compact value={formatMoney(wallet)}        label="Wallet" />
          <View style={{ width: SPACING.sm }} />
          <StatCard compact value={memberSince(user?.createdAt)} label="Member since" />
        </View>

        {/* ── My Wallet ─────────────────────────────────────────────── */}
        <Section title="MY WALLET">
          <View style={[styles.card, styles.walletCard]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.walletLabel}>Available balance</Text>
              <Text style={styles.walletAmount}>{formatMoney(wallet)}</Text>
            </View>
            <TouchableOpacity onPress={topUp} style={styles.topUpBtn} accessibilityLabel="Top up wallet">
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.topUpText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Personal info ─────────────────────────────────────────── */}
        <Section title="PERSONAL INFO">
          <View style={styles.card}>
            <EditableRow
              icon="person-outline"
              label="Name"
              value={user?.name || '—'}
              isEditing={editing === 'name'}
              draft={draft}
              setDraft={setDraft}
              onEdit={() => startEdit('name')}
              onSave={commitEdit}
              onCancel={() => setEditing(null)}
              saving={saving}
            />
            <Divider />
            <Row
              icon="mail-outline"
              label="Email"
              value={user?.email || '—'}
              hint="contact support"
            />
            <Divider />
            <EditableRow
              icon="call-outline"
              label="Phone"
              value={user?.phone ? formatPhone(user.phone) : '—'}
              isEditing={editing === 'phone'}
              draft={draft}
              setDraft={setDraft}
              onEdit={() => startEdit('phone')}
              onSave={commitEdit}
              onCancel={() => setEditing(null)}
              saving={saving}
              keyboardType="phone-pad"
            />
            <Divider />
            <Row
              icon="lock-closed-outline"
              label="Password"
              value="••••••••"
              actionLabel="Change →"
              onAction={() => setPwOpen(true)}
            />
          </View>
        </Section>

        {/* ── Language ──────────────────────────────────────────────── */}
        <Section title="LANGUAGE">
          <View style={[styles.card, { flexDirection: 'row', padding: SPACING.xs }]}>
            <LangBtn label="EN" active={language === 'en'} onPress={() => changeLanguage('en')} />
            <LangBtn label="SW" active={language === 'sw'} onPress={() => changeLanguage('sw')} />
          </View>
        </Section>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <Section title="NOTIFICATIONS">
          <View style={styles.card}>
            <ToggleRow
              icon="chatbubble-outline"
              label="SMS Notifications"
              hint="Order updates via SMS"
              value={prefs.sms}
              onChange={(v) => togglePref('sms', v)}
            />
            <Divider />
            <ToggleRow
              icon="mail-outline"
              label="Email Promotions"
              hint="Deals and offers"
              value={prefs.email}
              onChange={(v) => togglePref('email', v)}
            />
            <Divider />
            <ToggleRow
              icon="logo-whatsapp"
              label="WhatsApp Updates"
              hint="Order status messages"
              value={prefs.whatsapp}
              onChange={(v) => togglePref('whatsapp', v)}
              last
            />
          </View>
        </Section>

        {/* ── Quick links ───────────────────────────────────────────── */}
        <Section title="MORE">
          <View style={styles.card}>
            <LinkRow
              icon="receipt-outline"
              label="My Orders"
              onPress={() => navigation?.navigate?.('OrdersTab')}
            />
            <Divider />
            <LinkRow
              icon="pricetag-outline"
              label="My Promo Codes"
              hint="Coming soon"
              disabled
            />
            <Divider />
            <LinkRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => Alert.alert('Help', 'Reach us at support@kebite.co.tz')}
              last
            />
          </View>
        </Section>

        {/* ── Sign out ──────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
          <TouchableOpacity onPress={confirmLogout} style={styles.signOut} accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={20} color={COLORS.errorText} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Kebite v1.0 · Tanzania TZ</Text>
      </ScrollView>

      <ChangePasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, hint, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={COLORS.activeOrange} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.actionLink}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function EditableRow({
  icon, label, value, isEditing, draft, setDraft,
  onEdit, onSave, onCancel, saving, keyboardType,
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={COLORS.activeOrange} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            style={styles.input}
            keyboardType={keyboardType || 'default'}
            placeholder={value}
            placeholderTextColor={COLORS.textLight}
            editable={!saving}
          />
        ) : (
          <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
        )}
      </View>
      {isEditing ? (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={onCancel} disabled={saving} style={styles.iconBtn}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSave} disabled={saving} style={styles.iconBtn}>
            {saving
              ? <ActivityIndicator size="small" color={COLORS.activeOrange} />
              : <Ionicons name="checkmark" size={20} color={COLORS.successText} />}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onEdit} hitSlop={8} accessibilityLabel={`Edit ${label}`}>
          <Ionicons name="pencil" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ToggleRow({ icon, label, hint, value, onChange, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={20} color={COLORS.activeOrange} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: '#d1d5db', true: COLORS.activeOrange }}
        thumbColor={COLORS.white}
        ios_backgroundColor="#d1d5db"
      />
    </View>
  );
}

function LinkRow({ icon, label, hint, onPress, disabled, last }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[styles.row, last && { borderBottomWidth: 0 }]}
    >
      <Ionicons name={icon} size={20} color={disabled ? COLORS.textLight : COLORS.activeOrange} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={[styles.rowLabel, disabled && { color: COLORS.textLight }]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={disabled ? COLORS.textLight : COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function LangBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.langBtn, active && styles.langBtnActive]}>
      <Text style={[styles.langBtnText, active && styles.langBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() { return <View style={styles.divider} />; }

function ChangePasswordModal({ visible, onClose }) {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [busy,    setBusy]    = useState(false);

  function reset() { setCurrent(''); setNext(''); }
  function close() { reset(); onClose?.(); }

  async function submit() {
    if (!current || !next) { Alert.alert('Required', 'Both fields are required'); return; }
    if (next.length < 6)   { Alert.alert('Too short', 'New password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: current, newPassword: next });
      Alert.alert('Password updated', 'Use your new password next time you sign in.');
      close();
    } catch (err) {
      Alert.alert('Could not change password', err.response?.data?.message || 'Try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change password</Text>
          <Text style={styles.modalHint}>Enter your current password and a new one (min 6 characters).</Text>
          <TextInput
            value={current} onChangeText={setCurrent}
            placeholder="Current password" placeholderTextColor={COLORS.textLight}
            secureTextEntry editable={!busy}
            style={styles.modalInput}
          />
          <TextInput
            value={next} onChangeText={setNext}
            placeholder="New password" placeholderTextColor={COLORS.textLight}
            secureTextEntry editable={!busy}
            style={styles.modalInput}
          />
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <TouchableOpacity onPress={close} disabled={busy} style={[styles.modalBtn, styles.modalBtnCancel]}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={busy} style={[styles.modalBtn, styles.modalBtnPrimary]}>
              {busy
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.modalBtnPrimaryText}>Update</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroRow: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
  },
  heroName:  { color: COLORS.white, fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.md },
  heroEmail: { color: 'rgba(255,255,255,0.9)', fontSize: FONT_SIZE.base, marginTop: 2 },

  statsRow: {
    flexDirection:    'row',
    paddingHorizontal: SPACING.lg,
    marginTop:        -SPACING.xl,
  },

  sectionTitle: {
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.bold,
    color:         COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom:  SPACING.sm,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOW.sm,
  },

  walletCard: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: SPACING.lg,
  },
  walletLabel:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  walletAmount: { color: COLORS.dark, fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  topUpBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              SPACING.xs,
    backgroundColor:  COLORS.activeOrange,
    paddingHorizontal: SPACING.lg,
    paddingVertical:  SPACING.sm + 2,
    borderRadius:     RADIUS.pill,
  },
  topUpText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },

  row: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: SPACING.md + 2,
  },
  divider:    { height: 1, backgroundColor: COLORS.divider },
  rowLabel:   { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.4 },
  rowValue:   { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base, marginTop: 2 },
  hint:       { color: COLORS.textLight, fontSize: FONT_SIZE.xs, marginTop: 2 },
  actionLink: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  iconBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  input: {
    color:    COLORS.dark,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    paddingVertical: 0,
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.activeOrange,
  },

  langBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems:      'center',
    borderRadius:    RADIUS.pill,
  },
  langBtnActive:    { backgroundColor: COLORS.activeOrange },
  langBtnText:      { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.textBody },
  langBtnTextActive:{ color: COLORS.white },

  signOut: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorBg,
    paddingVertical: SPACING.md + 2,
    borderRadius:   RADIUS.pill,
    gap:            SPACING.sm,
  },
  signOutText: { color: COLORS.errorText, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },

  footer: {
    textAlign:  'center',
    color:      COLORS.textLight,
    fontSize:   FONT_SIZE.xs,
    marginTop:  SPACING.xl,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  modalHint:  { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.md },
  modalInput: {
    borderWidth:  1,
    borderColor:  COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.dark,
    marginTop: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  modalBtnCancel:     { backgroundColor: '#f3f4f6' },
  modalBtnCancelText: { color: COLORS.textBody, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  modalBtnPrimary:    { backgroundColor: COLORS.activeOrange },
  modalBtnPrimaryText:{ color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
});
