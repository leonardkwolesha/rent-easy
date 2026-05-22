import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, Modal, RefreshControl, Animated, Platform, Image, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, tabBar } from 'shared/theme';
import { formatMoney } from 'shared/formatters';
import { useAuth } from '../context/AuthContext';
import { disconnectSocket } from 'shared/socket';
import api from 'shared/api';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

// ── Pulsing skeleton row ──────────────────────────────────────────────────────
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
    <Animated.View style={[sk.row, { opacity: op }]}>
      <View style={sk.icon} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={sk.line1} />
        <View style={sk.line2} />
      </View>
    </Animated.View>
  );
}
const sk = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  icon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.border },
  line1: { width: '35%', height: 10, borderRadius: 4, backgroundColor: COLORS.border },
  line2: { width: '65%', height: 14, borderRadius: 4, backgroundColor: COLORS.border },
});

// ── Section card with orange label ───────────────────────────────────────────
function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>
        {children}
      </View>
    </View>
  );
}

// ── Info row — shows chevron and "Tap to add" only when tappable ──────────────
function InfoRow({ icon, label, value, onPress, isLast = false }) {
  const hasValue = value && value !== '';
  const display  = hasValue ? value : (onPress ? 'Tap to add' : '—');
  const empty    = !hasValue;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.65 : 1}
      style={[s.row, !isLast && s.rowBorder]}
      accessibilityLabel={label}
    >
      <View style={s.iconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={[s.rowValue, empty && s.rowValueEmpty]}>
          {display}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={15} color="#d0d0d0" />}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Profile({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [restaurant,      setRestaurant]      = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [refreshing,      setRef]             = useState(false);
  const [logoutBusy,      setLogoutBusy]      = useState(false);
  const [toggleBusy,      setToggleBusy]      = useState(false);
  const [avatarUri,       setAvatarUri]       = useState(user?.avatar || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSheet,     setAvatarSheet]     = useState(false);

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await api.get('/restaurant/me');
      setRestaurant(res.data);
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Could not load profile.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  // Keep avatar in sync with auth context (e.g. after upload or fresh login)
  useEffect(() => {
    if (user?.avatar) setAvatarUri(user.avatar);
  }, [user?.avatar]);

  // ── Open/Closed toggle ────────────────────────────────────────────────────
  async function toggleOpen() {
    if (!restaurant || toggleBusy) return;
    const next = !restaurant.isOpen;
    setToggleBusy(true);
    setRestaurant((prev) => ({ ...prev, isOpen: next }));
    try {
      await api.put('/restaurant/me', { isOpen: next });
    } catch {
      setRestaurant((prev) => ({ ...prev, isOpen: !next }));
    } finally {
      setToggleBusy(false);
    }
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  async function pickAvatar(useCamera) {
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permResult.status !== 'granted') {
      Alert.alert('Permission required', useCamera ? 'Camera access is needed.' : 'Photo library access is needed.');
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
      formData.append('avatar', { uri: asset.uri, name: `avatar_${Date.now()}.jpg`, type: 'image/jpeg' });
      const res = await api.post('/users/me/avatar', formData, {
        headers:          { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(d) => d],
      });
      if (res.data?.avatar) {
        setAvatarUri(res.data.avatar);
        setRestaurant((prev) => ({ ...prev, avatar: res.data.avatar }));
        if (setUser) setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
      }
    } catch { /* keep local preview */ }
    finally { setAvatarUploading(false); }
  }

  async function removeAvatar() {
    try { await api.delete('/users/me/avatar'); } catch {}
    setAvatarUri(null);
    setRestaurant((prev) => ({ ...prev, avatar: null }));
    if (setUser) setUser((prev) => ({ ...prev, avatar: null }));
  }

  function showAvatarOptions() {
    setAvatarSheet(true);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function confirmLogout() {
    if (logoutBusy) return;
    const proceed = Platform.OS === 'web'
      ? window.confirm('Sign out of Kebite?')
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

  // ── Derived values ────────────────────────────────────────────────────────
  const displayName   = restaurant?.name || user?.restaurantName || user?.name || 'Restaurant';
  const isOpen        = restaurant?.isOpen ?? false;
  const cuisineDisplay =
    Array.isArray(restaurant?.cuisine) && restaurant.cuisine.length
      ? restaurant.cuisine.join(', ')
      : typeof restaurant?.cuisine === 'string' && restaurant.cuisine
        ? restaurant.cuisine
        : null;

  const goEdit = () => navigation.navigate('EditProfile', { restaurant });

  const bottomPad = tabBar.height + Math.max(insets.bottom, 16) + 16;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>

      {/* ── Navy header — flush with status bar ── */}
      <LinearGradient
        colors={[NAVY, NAVY2]}
        style={[s.header, { paddingTop: insets.top + 14 }]}
      >
        {/* Edit pencil — top right, offset from safe area */}
        <TouchableOpacity
          onPress={goEdit}
          accessibilityLabel="Edit profile"
          style={[s.editBtn, { top: insets.top + 14 }]}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <TouchableOpacity onPress={showAvatarOptions} style={s.avatar} accessibilityLabel="Change profile photo">
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} onError={() => setAvatarUri(null)} />
              : <Ionicons name="restaurant-outline" size={36} color={COLORS.orange} />
            }
            <View style={s.cameraBadge}>
              {avatarUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.name} numberOfLines={1}>{displayName}</Text>
        <Text style={s.email}>{user?.email || ''}</Text>

        {/* Open/Closed — tappable to toggle */}
        {restaurant && (
          <TouchableOpacity
            onPress={toggleOpen}
            disabled={toggleBusy}
            activeOpacity={0.75}
            style={[s.statusPill, {
              backgroundColor: isOpen ? 'rgba(46,204,113,0.15)' : 'rgba(231,57,70,0.15)',
              borderColor:     isOpen ? '#2ecc71'               : '#e63946',
            }]}
          >
            {toggleBusy ? (
              <ActivityIndicator size="small" color={isOpen ? '#2ecc71' : '#e63946'} />
            ) : (
              <>
                <View style={[s.statusDot, { backgroundColor: isOpen ? '#2ecc71' : '#e63946' }]} />
                <Text style={[s.statusText, { color: isOpen ? '#2ecc71' : '#e63946' }]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── Body ── */}
      {loading && !restaurant ? (
        <View style={{ padding: 16, gap: 8, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map((k) => <SkeletonRow key={k} />)}
        </View>
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchProfile} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: bottomPad }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRef(true); fetchProfile(true); }}
              tintColor={COLORS.orange}
            />
          }
        >

          {/* ── Restaurant info ── */}
          <Section title="RESTAURANT INFO">
            <InfoRow
              icon={<Ionicons name="restaurant-outline" size={18} color={COLORS.orange} />}
              label="Restaurant name"
              value={restaurant?.name}
              onPress={goEdit}
            />
            <InfoRow
              icon={<Ionicons name="pizza-outline" size={18} color={COLORS.orange} />}
              label="Cuisine type"
              value={cuisineDisplay}
              onPress={goEdit}
            />
            <InfoRow
              icon={<Ionicons name="document-text-outline" size={18} color={COLORS.orange} />}
              label="Description"
              value={restaurant?.description}
              onPress={goEdit}
              isLast
            />
          </Section>

          {/* ── Contact ── */}
          <Section title="CONTACT">
            <InfoRow
              icon={<Ionicons name="person-outline" size={18} color={COLORS.orange} />}
              label="Owner name"
              value={user?.name}
            />
            <InfoRow
              icon={<Ionicons name="mail-outline" size={18} color={COLORS.orange} />}
              label="Email"
              value={user?.email}
            />
            <InfoRow
              icon={<Ionicons name="call-outline" size={18} color={COLORS.orange} />}
              label="Phone"
              value={restaurant?.phone || user?.phone}
              onPress={goEdit}
            />
            <InfoRow
              icon={<Ionicons name="location-outline" size={18} color={COLORS.orange} />}
              label="Address"
              value={restaurant?.location?.address}
              onPress={goEdit}
              isLast
            />
          </Section>

          {/* ── Operations ── */}
          <Section title="OPERATIONS">
            <InfoRow
              icon={<Ionicons name="time-outline" size={18} color={COLORS.orange} />}
              label="Prep time"
              value={restaurant?.deliveryTime ? `${restaurant.deliveryTime} min` : null}
              onPress={goEdit}
            />
            <InfoRow
              icon={<Ionicons name="cart-outline" size={18} color={COLORS.orange} />}
              label="Min order"
              value={restaurant?.minOrder ? formatMoney(restaurant.minOrder) : null}
              onPress={goEdit}
            />
            <InfoRow
              icon={<Ionicons name="bicycle-outline" size={18} color={COLORS.orange} />}
              label="Delivery fee"
              value={restaurant?.deliveryFee ? formatMoney(restaurant.deliveryFee) : null}
              onPress={goEdit}
              isLast
            />
          </Section>

          {/* ── Performance — read-only, no chevrons ── */}
          <Section title="PERFORMANCE">
            <InfoRow
              icon={<Ionicons name="star-outline" size={18} color={COLORS.orange} />}
              label="Rating"
              value={restaurant?.rating ? `${restaurant.rating.toFixed(1)} / 5.0` : null}
            />
            <InfoRow
              icon={<Ionicons name="people-outline" size={18} color={COLORS.orange} />}
              label="Total reviews"
              value={restaurant?.ratingCount ? `${restaurant.ratingCount} review${restaurant.ratingCount !== 1 ? 's' : ''}` : null}
              isLast
            />
          </Section>

          {/* ── Account ── */}
          <Section title="ACCOUNT">
            <InfoRow
              icon={<Ionicons name="help-circle-outline" size={18} color={COLORS.orange} />}
              label="Help & support"
              onPress={() => Linking.openURL('mailto:support@kebite.co.tz')}
            />
            <InfoRow
              icon={<Ionicons name="document-outline" size={18} color={COLORS.orange} />}
              label="Terms of service"
              onPress={() => Linking.openURL('https://kebite.co.tz/terms')}
            />
            <InfoRow
              icon={<Ionicons name="shield-outline" size={18} color={COLORS.orange} />}
              label="Privacy policy"
              onPress={() => Linking.openURL('https://kebite.co.tz/privacy')}
              isLast
            />
          </Section>

          {/* ── Sign Out ── */}
          <TouchableOpacity
            onPress={confirmLogout}
            disabled={logoutBusy}
            accessibilityLabel="Sign out"
            style={s.logoutBtn}
            activeOpacity={0.75}
          >
            {logoutBusy
              ? <ActivityIndicator color={COLORS.errorText} />
              : <>
                  <Ionicons name="log-out-outline" size={20} color={COLORS.errorText} />
                  <Text style={s.logoutText}>Sign Out</Text>
                </>
            }
          </TouchableOpacity>

        </ScrollView>
      )}

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
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header: {
    paddingBottom:     28,
    paddingHorizontal: 20,
    alignItems:        'center',
    gap:               SPACING.xs,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  editBtn: {
    position:        'absolute',
    right:           16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius:    20,
    padding:         9,
  },

  // Avatar
  avatarWrap: { position: 'relative', marginBottom: SPACING.sm },
  avatar: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2.5,
    borderColor:     '#ff6b00',
  },
  avatarImg:    { width: 88, height: 88, borderRadius: 44 },
  cameraBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           28,
    height:          28,
    borderRadius:    14,
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

  // Name / email
  name:  { color: '#fff', fontSize: 22, fontWeight: '800', maxWidth: '80%', textAlign: 'center' },
  email: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, marginBottom: 4 },

  // Status pill
  statusPill: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    borderWidth:    1,
    borderRadius:   20,
    paddingHorizontal: 16,
    paddingVertical:   7,
    marginTop:      SPACING.xs,
    minWidth:       80,
    justifyContent: 'center',
  },
  statusDot:  { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 13, fontWeight: '600' },

  // Section wrapper
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize:      11,
    fontWeight:    '700',
    color:         COLORS.orange,
    letterSpacing: 1.2,
    marginBottom:  10,
    marginLeft:    4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius:    16,
    borderWidth:     0.5,
    borderColor:     '#ebebeb',
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       1,
  },

  // Info rows
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   13,
    gap:            12,
  },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: '#fff4ee',
    alignItems:      'center',
    justifyContent:  'center',
  },
  rowLabel:      { fontSize: 11, color: '#999', marginBottom: 2 },
  rowValue:      { fontSize: 14, fontWeight: '600', color: NAVY },
  rowValueEmpty: { fontWeight: '400', color: '#bbb', fontStyle: 'italic' },

  // Sign out
  logoutBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    marginHorizontal: 16,
    marginBottom:   8,
    padding:        16,
    borderRadius:   16,
    borderWidth:    1,
    borderColor:    'rgba(153,27,27,0.25)',
    backgroundColor:'rgba(153,27,27,0.06)',
  },
  logoutText: { color: COLORS.errorText, fontWeight: '700', fontSize: 15 },

});

const avs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor:      COLORS.cardBg,
    borderTopLeftRadius:  RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding:              20,
    paddingBottom:        40,
  },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 17, fontWeight: '700', color: NAVY, marginBottom: 8 },
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(232,82,26,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  cancel: {
    marginTop:       12,
    paddingVertical: 14,
    borderRadius:    24,
    backgroundColor: '#f3f4f6',
    alignItems:      'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#555' },
});
