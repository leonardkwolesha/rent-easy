import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Switch, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from 'shared/api';
import { formatPhone, formatMoney } from 'shared/formatters';
import { disconnectSocket } from 'shared/socket';
import { useAuth } from '../context/AuthContext';
import {
  COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW,
} from 'shared/theme';
import {
  GradientHeader, Avatar, Badge, StatCard,
} from 'shared/components';

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

  // Avatar
  const [avatarSheet,   setAvatarSheet]   = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Password modal
  const [pwOpen,      setPwOpen]     = useState(false);
  const [topUpOpen,   setTopUpOpen]  = useState(false);
  const [logoutBusy,  setLogoutBusy] = useState(false);

  async function launchPicker(mode) {
    if (mode === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take a photo.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to pick an image.');
        return;
      }
    }

    const opts = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };

    const result = mode === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (!result.canceled && result.assets?.[0]) {
      uploadAvatar(result.assets[0]);
    }
  }

  async function uploadAvatar(asset) {
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri:  asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: 'avatar.jpg',
      });
      // transformRequest bypasses axios JSON serialisation so FormData passes through raw
      const { data } = await api.post('/users/me/avatar', formData, {
        headers:          { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(d) => d],
      });
      setUser((u) => (u ? { ...u, avatar: data.avatar } : u));
    } catch (err) {
      Alert.alert('Upload failed', err.response?.data?.message || 'Could not update photo. Try again.');
    } finally {
      setAvatarLoading(false);
    }
  }

  async function deleteAvatar() {
    setAvatarLoading(true);
    try {
      await api.delete('/users/me/avatar');
      setUser((u) => (u ? { ...u, avatar: null } : u));
    } catch (err) {
      Alert.alert('Remove failed', err.response?.data?.message || 'Could not remove photo.');
    } finally {
      setAvatarLoading(false);
    }
  }

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

  async function confirmLogout() {
    if (logoutBusy) return;
    const proceed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise((resolve) => {
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sign out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!proceed) return;
    setLogoutBusy(true);
    try { disconnectSocket(); } catch {}
    try { await logout(); } catch {}
    setLogoutBusy(false);
  }

  const orderCount = user?.orderCount ?? 0;
  const wallet     = user?.walletBalance ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Gradient header ────────────────────────────────────────── */}
        <GradientHeader
          title="My Profile"
          topInset={48}
          right={
            <TouchableOpacity
              onPress={confirmLogout}
              disabled={logoutBusy}
              hitSlop={8}
              accessibilityLabel="Sign out"
            >
              {logoutBusy
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
              }
            </TouchableOpacity>
          }
        >
          <View style={styles.heroRow}>
            <TouchableOpacity
              onPress={() => setAvatarSheet(true)}
              activeOpacity={0.85}
              style={styles.avatarWrap}
              accessibilityLabel="Change profile photo"
              disabled={avatarLoading}
            >
              <Avatar name={user?.name} uri={user?.avatar} size={84} variant="glass" />
              <View style={styles.cameraBadge}>
                {avatarLoading
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Ionicons name="camera" size={14} color={COLORS.white} />}
              </View>
            </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setTopUpOpen(true)} style={styles.topUpBtn} accessibilityLabel="Top up wallet">
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
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => Linking.openURL('mailto:support@kebite.co.tz')}
            />
            <Divider />
            <LinkRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://kebite.co.tz/privacy')}
              last
            />
          </View>
        </Section>

        {/* ── Sign out ──────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
          <TouchableOpacity
            onPress={confirmLogout}
            disabled={logoutBusy}
            style={[styles.signOut, logoutBusy && { opacity: 0.6 }]}
            accessibilityLabel="Sign out"
          >
            {logoutBusy ? (
              <ActivityIndicator size="small" color={COLORS.errorText} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={COLORS.errorText} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Kebite v1.0 · Tanzania TZ</Text>
      </ScrollView>

      <AvatarSheet
        visible={avatarSheet}
        hasAvatar={!!user?.avatar}
        onClose={() => setAvatarSheet(false)}
        onTakePhoto={() => { setAvatarSheet(false); setTimeout(() => launchPicker('camera'),  600); }}
        onChooseLibrary={() => { setAvatarSheet(false); setTimeout(() => launchPicker('library'), 600); }}
        onRemove={() => { setAvatarSheet(false); setTimeout(() => deleteAvatar(), 150); }}
      />
      <ChangePasswordModal visible={pwOpen} onClose={() => setPwOpen(false)} />
      <TopUpModal
        visible={topUpOpen}
        phone={user?.phone}
        onClose={() => setTopUpOpen(false)}
        onSuccess={(newBalance) => {
          setTopUpOpen(false);
          if (newBalance !== undefined) setUser((u) => u ? { ...u, walletBalance: newBalance } : u);
        }}
      />
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

// ── Avatar picker sheet ────────────────────────────────────────────────────

function AvatarSheet({ visible, hasAvatar, onClose, onTakePhoto, onChooseLibrary, onRemove }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={avs.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={avs.sheet}>
          <View style={avs.handle} />
          <Text style={avs.title}>Profile Photo</Text>

          <TouchableOpacity onPress={onTakePhoto} style={avs.option} activeOpacity={0.7}>
            <View style={avs.optionIcon}>
              <Ionicons name="camera-outline" size={22} color={COLORS.activeOrange} />
            </View>
            <Text style={avs.optionText}>Take Photo</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onChooseLibrary} style={avs.option} activeOpacity={0.7}>
            <View style={avs.optionIcon}>
              <Ionicons name="image-outline" size={22} color={COLORS.activeOrange} />
            </View>
            <Text style={avs.optionText}>Choose from Library</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          {hasAvatar && (
            <TouchableOpacity onPress={onRemove} style={avs.option} activeOpacity={0.7}>
              <View style={[avs.optionIcon, { backgroundColor: COLORS.errorBg }]}>
                <Ionicons name="trash-outline" size={22} color={COLORS.errorText} />
              </View>
              <Text style={[avs.optionText, { color: COLORS.errorText }]}>Remove Photo</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={avs.cancel} activeOpacity={0.7}>
            <Text style={avs.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const avs = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor:      COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding:              SPACING.xl,
    paddingBottom:        SPACING.xxxl,
  },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  title:    { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, marginBottom: SPACING.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(232,82,26,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textBody },
  cancel: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.textBody },
});

// ── Top-up modal ───────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];
const PAY_METHODS   = [
  { id: 'mpesa',  label: 'M-Pesa',      icon: 'phone-portrait-outline' },
  { id: 'airtel', label: 'Airtel Money', icon: 'phone-portrait-outline' },
  { id: 'mixx',   label: 'Mixx by Yas', icon: 'phone-portrait-outline' },
];

function TopUpModal({ visible, phone, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('');
  const [method,  setMethod]  = useState('mpesa');
  const [tel,     setTel]     = useState(phone || '');
  const [busy,    setBusy]    = useState(false);
  const [errMsg,  setErrMsg]  = useState('');

  useEffect(() => { if (phone) setTel(phone); }, [phone]);

  function reset() { setAmount(''); setMethod('mpesa'); setErrMsg(''); }
  function close()  { reset(); onClose?.(); }

  async function submit() {
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1000) { setErrMsg('Minimum top-up is TSh 1,000'); return; }
    if (!tel.trim())        { setErrMsg('Enter your phone number'); return; }
    setErrMsg(''); setBusy(true);
    try {
      const res = await api.post('/payments/topup', {
        amount: amt, method, phone: tel.trim(),
      });
      Alert.alert(
        'Top-up initiated',
        `You'll receive a ${PAY_METHODS.find((m) => m.id === method)?.label} prompt shortly.`,
        [{ text: 'OK', onPress: () => onSuccess?.(res.data?.walletBalance) }]
      );
    } catch (err) {
      setErrMsg(err?.response?.data?.message || 'Could not initiate top-up. Try again.');
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
          <View style={topUp.handle} />
          <Text style={styles.modalTitle}>Top up wallet</Text>
          <Text style={styles.modalHint}>Add funds using mobile money.</Text>

          {/* Quick amount chips */}
          <View style={topUp.amtRow}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => setAmount(String(a))}
                style={[topUp.amtChip, String(a) === amount && topUp.amtChipActive]}
              >
                <Text style={[topUp.amtChipText, String(a) === amount && topUp.amtChipTextActive]}>
                  {a.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, '')); setErrMsg(''); }}
            placeholder="Or enter amount (TSh)"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            editable={!busy}
            style={styles.modalInput}
          />

          {/* Payment methods */}
          <Text style={topUp.sectionLabel}>Payment method</Text>
          {PAY_METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[topUp.methodRow, method === m.id && topUp.methodRowActive]}
            >
              <Ionicons
                name={m.icon}
                size={20}
                color={method === m.id ? COLORS.activeOrange : COLORS.textMuted}
              />
              <Text style={[topUp.methodLabel, method === m.id && topUp.methodLabelActive]}>
                {m.label}
              </Text>
              <View style={[topUp.radio, method === m.id && topUp.radioActive]}>
                {method === m.id && <View style={topUp.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Phone */}
          <TextInput
            value={tel}
            onChangeText={(v) => { setTel(v); setErrMsg(''); }}
            placeholder="+255 7XX XXX XXX"
            placeholderTextColor={COLORS.textLight}
            keyboardType="phone-pad"
            editable={!busy}
            style={[styles.modalInput, { marginTop: SPACING.sm }]}
          />

          {errMsg ? <Text style={topUp.errMsg}>{errMsg}</Text> : null}

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <TouchableOpacity onPress={close} disabled={busy} style={[styles.modalBtn, styles.modalBtnCancel]}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={busy} style={[styles.modalBtn, styles.modalBtnPrimary]}>
              {busy
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.modalBtnPrimaryText}>Pay now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const topUp = StyleSheet.create({
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  amtRow:     { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: 'wrap' },
  amtChip:    { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.pageBg },
  amtChipActive:    { backgroundColor: COLORS.activeOrange, borderColor: COLORS.activeOrange },
  amtChipText:      { color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  amtChipTextActive:{ color: '#fff' },
  sectionLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  methodRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm + 2, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  methodRowActive: {},
  methodLabel:      { flex: 1, color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  methodLabelActive:{ color: COLORS.activeOrange },
  radio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.activeOrange },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.activeOrange },
  errMsg:   { color: COLORS.errorText, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
});

// ── Change password modal ──────────────────────────────────────────────────

function ChangePasswordModal({ visible, onClose }) {
  const [current,     setCurrent]     = useState('');
  const [next,        setNext]        = useState('');
  const [busy,        setBusy]        = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext,    setShowNext]    = useState(false);

  function reset() { setCurrent(''); setNext(''); setShowCurrent(false); setShowNext(false); }
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change password</Text>
          <Text style={styles.modalHint}>Enter your current password and a new one (min 6 characters).</Text>

          {/* Current password */}
          <View style={styles.pwFieldWrap}>
            <TextInput
              value={current} onChangeText={setCurrent}
              placeholder="Current password" placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showCurrent} editable={!busy}
              style={styles.pwInput}
            />
            <TouchableOpacity
              onPress={() => setShowCurrent((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* New password */}
          <View style={styles.pwFieldWrap}>
            <TextInput
              value={next} onChangeText={setNext}
              placeholder="New password" placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showNext} editable={!busy}
              style={styles.pwInput}
            />
            <TouchableOpacity
              onPress={() => setShowNext((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={showNext ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showNext ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

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
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.activeOrange,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     COLORS.white,
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
  pwFieldWrap: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    COLORS.border,
    borderRadius:   RADIUS.md,
    marginTop:      SPACING.sm,
    backgroundColor: COLORS.cardBg,
  },
  pwInput: {
    flex:             1,
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.md,
    fontSize:         FONT_SIZE.base,
    color:            COLORS.dark,
  },
  eyeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    justifyContent:    'center',
    alignItems:        'center',
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
