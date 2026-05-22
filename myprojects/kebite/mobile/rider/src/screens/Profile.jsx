import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, Modal, ActivityIndicator, Platform, Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from 'shared/theme';
import { formatPhone, isValidTzPhone } from 'shared/formatters';
import api from 'shared/api';
import { useAuth } from '../context/AuthContext';
import { disconnectSocket } from 'shared/socket';

import * as ImagePicker from 'expo-image-picker';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

const VEHICLE_ICONS = {
  motorcycle: 'bicycle',
  bicycle:    'bicycle-outline',
  car:        'car-outline',
};

export default function Profile({ navigation }) {
  const { user, logout, setUser } = useAuth();

  const [riderData,     setRiderData]     = useState(null);
  const [analytics,     setAnalytics]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [editOpen,      setEditOpen]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form,          setForm]          = useState({ name: '', phone: '' });
  const [formErr,       setFormErr]       = useState({});
  const [toggling,      setToggling]      = useState(false);
  const [logoutBusy,    setLogoutBusy]    = useState(false);
  const [avatarUri,     setAvatarUri]     = useState(user?.avatar || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSheet,   setAvatarSheet]   = useState(false);
  const [supportOpen,   setSupportOpen]   = useState(false);
  const [termsOpen,     setTermsOpen]     = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/rider/me'),
        api.get('/rider/analytics'),
      ]);
      setRiderData(pRes.data);
      setAnalytics(aRes.data);
      if (pRes.data?.avatar) setAvatarUri(pRes.data.avatar);
    } catch {
      // fall back to auth context user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Keep avatar in sync with auth context (e.g. after fresh login)
  useEffect(() => {
    if (user?.avatar && !avatarUri) setAvatarUri(user.avatar);
  }, [user?.avatar]);

  const rider        = riderData || user;
  const isAvailable  = rider?.isAvailable ?? false;
  const initials     = (rider?.name || 'R').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  // ── Avatar picker ────────────────────────────────────────────────────────
  async function pickAvatar(useCamera) {
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permResult.status !== 'granted') {
      Alert.alert(
        'Permission required',
        useCamera
          ? 'Camera access is needed to take a photo.'
          : 'Photo library access is needed to choose a photo.',
      );
      return;
    }

    const opts = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled) return;

      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      await uploadAvatar(asset);
    } catch {
      Alert.alert('Photo picker', 'Could not open the photo picker. Please try again.');
    }
  }

  async function uploadAvatar(asset) {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri:  asset.uri,
        name: `avatar_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      const res = await api.post('/users/me/avatar', formData, {
        headers:          { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(d) => d],
      });
      if (res.data?.avatar) {
        setAvatarUri(res.data.avatar);
        setRiderData((prev) => ({ ...prev, avatar: res.data.avatar }));
        if (setUser) setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
      }
    } catch {
      // keep local preview even if upload fails
    } finally {
      setAvatarUploading(false);
    }
  }

  async function removeAvatar() {
    try {
      await api.delete('/users/me/avatar');
    } catch {
      // best-effort — clear locally regardless
    }
    setAvatarUri(null);
    setRiderData((prev) => ({ ...prev, avatar: null }));
    if (setUser) setUser((prev) => ({ ...prev, avatar: null }));
  }

  function showAvatarOptions() {
    setAvatarSheet(true);
  }

  // ── Edit profile ─────────────────────────────────────────────────────────
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

  // ── Availability toggle ───────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
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

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        {/* Avatar with camera overlay */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={showAvatarOptions}
            style={styles.avatarWrap}
            accessibilityLabel="Change profile photo"
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImg}
                onError={() => setAvatarUri(null)}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}

            {/* Camera badge bottom-right */}
            <View style={styles.cameraBadge}>
              {avatarUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />
              }
            </View>
          </TouchableOpacity>

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

        {/* Account actions */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <ActionRow icon="help-circle-outline"  label="Help & support"   onPress={() => setSupportOpen(true)} />
          <View style={styles.rowDivider} />
          <ActionRow icon="document-text-outline" label="Terms of service" onPress={() => setTermsOpen(true)} />
          <View style={styles.rowDivider} />
          <ActionRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => Linking.openURL('https://kebite.co.tz/privacy')} />
        </View>

        <TouchableOpacity
          onPress={confirmLogout}
          disabled={logoutBusy}
          style={styles.logoutBtn}
          accessibilityLabel="Sign out"
        >
          {logoutBusy
            ? <ActivityIndicator color={COLORS.red} />
            : <>
                <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
                <Text style={styles.logoutText}>Sign out</Text>
              </>
          }
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

      {/* ── Help & Support modal ── */}
      <Modal visible={supportOpen} animationType="slide" transparent onRequestClose={() => setSupportOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: 36 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setSupportOpen(false)} accessibilityLabel="Close support">
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.supportIntro}>
              Our support team is available every day to help you with deliveries, payments, and account issues.
            </Text>

            {/* Support channels */}
            <SupportChannel
              icon="call"
              color="#25d366"
              label="Call support"
              value="0800-532483 (toll-free)"
              onPress={() => Linking.openURL('tel:0800532483')}
            />
            <SupportChannel
              icon="logo-whatsapp"
              color="#25d366"
              label="WhatsApp"
              value="+255 762 000 000"
              onPress={() => Linking.openURL('https://wa.me/255762000000')}
            />
            <SupportChannel
              icon="mail"
              color={COLORS.orange}
              label="Email support"
              value="riders@kebite.co.tz"
              onPress={() => Linking.openURL('mailto:riders@kebite.co.tz')}
            />

            <View style={styles.hoursBox}>
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.hoursText}>
                Available Mon – Sun, 6 AM – 11 PM (EAT)
              </Text>
            </View>

            <View style={styles.faqBox}>
              <Text style={styles.faqTitle}>Quick answers</Text>
              <FaqItem q="My order was assigned but the customer cancelled" a="You will still receive a cancellation compensation for your time. Check Earnings for details." />
              <FaqItem q="Payment not reflected in my wallet" a="Payments reflect within 24 hours. If delayed, tap 'Email support' above." />
              <FaqItem q="I was in an accident" a="Call our emergency line 0800-532483 immediately. Your safety comes first." />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Avatar sheet ── */}
      <Modal visible={avatarSheet} animationType="slide" transparent onRequestClose={() => setAvatarSheet(false)}>
        <View style={avs.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAvatarSheet(false)} />
          <View style={avs.sheet}>
            <View style={avs.handle} />
            <Text style={avs.title}>Profile Photo</Text>

            <TouchableOpacity
              onPress={() => { setAvatarSheet(false); setTimeout(() => pickAvatar(true), 600); }}
              style={avs.option}
              activeOpacity={0.7}
            >
              <View style={avs.optionIcon}>
                <Ionicons name="camera-outline" size={22} color={COLORS.activeOrange} />
              </View>
              <Text style={avs.optionText}>Take Photo</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setAvatarSheet(false); setTimeout(() => pickAvatar(false), 600); }}
              style={avs.option}
              activeOpacity={0.7}
            >
              <View style={avs.optionIcon}>
                <Ionicons name="image-outline" size={22} color={COLORS.activeOrange} />
              </View>
              <Text style={avs.optionText}>Choose from Library</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>

            {avatarUri && (
              <TouchableOpacity
                onPress={() => { setAvatarSheet(false); removeAvatar(); }}
                style={avs.option}
                activeOpacity={0.7}
              >
                <View style={[avs.optionIcon, { backgroundColor: COLORS.errorBg }]}>
                  <Ionicons name="trash-outline" size={22} color={COLORS.errorText} />
                </View>
                <Text style={[avs.optionText, { color: COLORS.errorText }]}>Remove Photo</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setAvatarSheet(false)} style={avs.cancel} activeOpacity={0.7}>
              <Text style={avs.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Terms of Service modal ── */}
      <Modal visible={termsOpen} animationType="slide" transparent onRequestClose={() => setTermsOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '90%' }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Terms of Service</Text>
              <TouchableOpacity onPress={() => setTermsOpen(false)} accessibilityLabel="Close terms">
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.termsUpdated}>Last updated: January 2025</Text>

              <TermsSection title="1. Rider Agreement">
                By using the Kebite Rider app you agree to deliver orders assigned to you in a timely, professional, and safe manner. You are an independent contractor, not an employee of Kebite Limited.
              </TermsSection>

              <TermsSection title="2. Eligibility">
                You must be at least 18 years old, hold a valid Tanzanian driving/riding licence appropriate for your vehicle type, and have a registered mobile money account (M-Pesa, Airtel Money, or Mixx by Yas) for receiving earnings.
              </TermsSection>

              <TermsSection title="3. Earnings & Payments">
                Earnings are calculated per delivery and credited to your linked mobile money wallet within 24 hours of delivery completion. Kebite reserves the right to adjust the fee structure with 7 days' notice via in-app notification.
              </TermsSection>

              <TermsSection title="4. Conduct & Quality">
                Riders must maintain a minimum average rating of 3.0 stars. Repeated complaints of rude behaviour, food tampering, or late deliveries may result in account suspension or permanent deactivation.
              </TermsSection>

              <TermsSection title="5. Safety & Traffic Laws">
                You are solely responsible for complying with all Tanzanian road traffic regulations. Kebite does not cover fines, penalties, or liability arising from traffic violations. Helmets are mandatory for motorcycle riders.
              </TermsSection>

              <TermsSection title="6. Data & Privacy">
                Your location is tracked only while you are marked Online and have an active delivery. Location data is shared with the assigned customer and restaurant only for that delivery. We do not sell your data to third parties.
              </TermsSection>

              <TermsSection title="7. Account Suspension">
                Kebite may suspend or deactivate your account without notice for fraud, impersonation, or repeated policy violations. You may appeal a suspension by contacting riders@kebite.co.tz within 14 days.
              </TermsSection>

              <TermsSection title="8. Changes to Terms">
                We may update these terms at any time. Continued use of the app after changes are published constitutes acceptance of the new terms.
              </TermsSection>

              <TouchableOpacity
                style={styles.termsWebLink}
                onPress={() => Linking.openURL('https://kebite.co.tz/terms')}
              >
                <Ionicons name="open-outline" size={14} color={COLORS.orange} />
                <Text style={styles.termsWebLinkText}>Read full terms on kebite.co.tz</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity onPress={() => setTermsOpen(false)} style={styles.saveBtn}>
              <Text style={styles.saveText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

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

function SupportChannel({ icon, color, label, value, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.supportRow} accessibilityLabel={label}>
      <View style={[styles.supportIconWrap, { backgroundColor: color + '1a' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.supportLabel}>{label}</Text>
        <Text style={styles.supportValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={styles.faqQ}
        accessibilityLabel={q}
      >
        <Text style={styles.faqQText}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
      {open && <Text style={styles.faqAText}>{a}</Text>}
    </View>
  );
}

function TermsSection({ title, children }) {
  return (
    <View style={styles.termsSection}>
      <Text style={styles.termsSectionTitle}>{title}</Text>
      <Text style={styles.termsSectionBody}>{children}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop:    56,
    paddingBottom: SPACING.xl,
    alignItems:    'center',
    gap:           SPACING.xs,
  },

  /* Avatar */
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarWrap: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.sm,
  },
  avatarImg: {
    width:        80,
    height:       80,
    borderRadius: 40,
  },
  avatarText: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  cameraBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: COLORS.orange,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     NAVY,
  },
  deleteBadge: {
    position:        'absolute',
    top:             0,
    right:           0,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: COLORS.red,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     NAVY,
  },

  name:  { color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  phone: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.sm },

  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: SPACING.md,
    paddingVertical:   6,
    borderRadius:      RADIUS.pill,
    marginTop:         SPACING.sm,
    borderWidth:       1,
  },
  badgeOnline:  { backgroundColor: COLORS.successBg, borderColor: COLORS.successText },
  badgeOffline: { backgroundColor: '#f3f4f6',         borderColor: COLORS.textLight },
  badgeDot:     { width: 7, height: 7, borderRadius: 4 },
  badgeText:    { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  body: { padding: SPACING.lg, paddingBottom: 120 },

  statsRow: {
    flexDirection:   'row',
    backgroundColor:  COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    paddingVertical: SPACING.md,
    marginBottom:    SPACING.xl,
    ...SHADOW.sm,
  },
  statCell:     { flex: 1, alignItems: 'center', gap: 2 },
  statVal:      { color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, marginTop: 4 },
  statLabel:    { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  statsDivider: { width: 1, backgroundColor: COLORS.border },

  sectionLabel: {
    color:         COLORS.textMuted,
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  SPACING.sm,
    marginTop:     SPACING.xl,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    overflow:        'hidden',
    ...SHADOW.sm,
  },
  infoRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    gap:               SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.textMuted, flex: 1, fontSize: FONT_SIZE.sm },
  infoValue: { color: COLORS.dark, fontWeight: FONT_WEIGHT.medium, fontSize: FONT_SIZE.sm, maxWidth: '55%' },

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
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    gap:               SPACING.md,
  },
  actionLabel: { color: COLORS.textBody, flex: 1, fontSize: FONT_SIZE.base },
  rowDivider:  { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  logoutBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    marginTop:      SPACING.xxl,
    paddingVertical:SPACING.md,
  },
  logoutText: { color: COLORS.red, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },

  /* Modals shared */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor:      COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding:              SPACING.xl,
    paddingBottom:        40,
  },
  sheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLORS.border,
    alignSelf:       'center',
    marginBottom:    SPACING.lg,
  },
  modalHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   SPACING.md,
  },
  sheetTitle: {
    color:      COLORS.dark,
    fontSize:   FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },

  /* Edit modal */
  fieldLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor:   COLORS.pageBg,
    borderRadius:      RADIUS.lg,
    borderWidth:       1,
    borderColor:       COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.md,
    fontSize:          FONT_SIZE.base,
    color:             COLORS.dark,
  },
  inputErr: { borderColor: COLORS.red },
  fieldErr: { color: COLORS.red, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  sheetActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
  cancelBtn: {
    flex:           1,
    paddingVertical:SPACING.md,
    borderRadius:   RADIUS.xl,
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    COLORS.border,
  },
  cancelText: { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  saveBtn: {
    flex:            1,
    paddingVertical: SPACING.md,
    borderRadius:    RADIUS.xl,
    alignItems:      'center',
    backgroundColor: NAVY,
    marginTop:       SPACING.md,
  },
  saveText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },

  /* Help & Support modal */
  supportIntro: {
    color:        COLORS.textMuted,
    fontSize:     FONT_SIZE.sm,
    lineHeight:   20,
    marginBottom: SPACING.lg,
  },
  supportRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  supportIconWrap: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  supportLabel: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginBottom: 2 },
  supportValue: { color: COLORS.dark, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  hoursBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   COLORS.pageBg,
    borderRadius:      RADIUS.lg,
    padding:           SPACING.md,
    marginTop:         SPACING.lg,
  },
  hoursText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, flex: 1 },
  faqBox: { marginTop: SPACING.lg },
  faqTitle: {
    color:        COLORS.dark,
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical:   SPACING.sm,
  },
  faqQ: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            SPACING.sm,
  },
  faqQText: { color: COLORS.dark, fontSize: FONT_SIZE.sm, flex: 1, lineHeight: 20 },
  faqAText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, lineHeight: 18 },

  /* Terms of Service modal */
  termsUpdated: {
    color:        COLORS.textLight,
    fontSize:     FONT_SIZE.xs,
    marginBottom: SPACING.lg,
  },
  termsSection: { marginBottom: SPACING.lg },
  termsSectionTitle: {
    color:        COLORS.dark,
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  termsSectionBody: {
    color:      COLORS.textMuted,
    fontSize:   FONT_SIZE.sm,
    lineHeight: 20,
  },
  termsWebLink: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    marginTop:      SPACING.sm,
    marginBottom:   SPACING.xl,
  },
  termsWebLinkText: {
    color:      COLORS.orange,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});

const avs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor:      COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding:              SPACING.xl,
    paddingBottom:        SPACING.xxxl ?? 40,
  },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  title:      { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, marginBottom: SPACING.md },
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    paddingVertical:   SPACING.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(232,82,26,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  optionText: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textBody },
  cancel: {
    marginTop:       SPACING.md,
    paddingVertical: SPACING.md + 2,
    borderRadius:    RADIUS.pill,
    backgroundColor: '#f3f4f6',
    alignItems:      'center',
  },
  cancelText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.textBody },
});
