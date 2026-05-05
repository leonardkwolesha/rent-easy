import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, StyleSheet, Modal, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatOrderId } from '../../../shared/formatters';
import api from '../../../shared/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import ErrorCard from '../components/ErrorCard';
import RestaurantCard from '../../../shared/components/RestaurantCard';
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton';

const CUISINE_KEYS = ['All', 'Tanzanian', 'Pizza', 'Seafood', 'Chicken', 'BBQ', 'Healthy', 'Burgers', 'Desserts'];
const CUISINE_ICONS = {
  All: 'restaurant-outline', Tanzanian: '🇹🇿', Pizza: '🍕', Seafood: '🐟',
  Chicken: '🍗', BBQ: '🔥', Healthy: '🥗', Burgers: '🍔', Desserts: '🍨',
};
const ACTIVE_STATUSES = new Set(['placed', 'confirmed', 'preparing', 'ready', 'on_the_way']);

function matchesCuisine(restaurant, cuisine) {
  if (cuisine === 'All') return true;
  const hay = `${restaurant.cuisine || ''} ${restaurant.cuisineType || ''} ${restaurant.name || ''}`.toLowerCase();
  return hay.includes(cuisine.toLowerCase());
}

export default function Home({ navigation }) {
  const { user }       = useAuth();
  const { t }          = useLang();
  const [restaurants, setRestaurants] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState('All');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [refreshing, setRefresh]      = useState(false);
  const [passOpen, setPassOpen]       = useState(false);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const chipSlide  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(chipSlide, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rRes, oRes] = await Promise.all([
        api.get('/restaurants'),
        api.get('/orders/my').catch(() => ({ data: [] })),
      ]);
      setRestaurants(rRes.data || []);
      const active = (oRes.data || []).find((o) => ACTIVE_STATUSES.has(o.status));
      setActiveOrder(active || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load restaurants.');
    } finally {
      setLoading(false); setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = restaurants.filter((r) => {
    const matchSearch = !search.trim() || r.name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && matchesCuisine(r, cuisine);
  });

  const featured = restaurants.filter((r) => r.featured || r.rating >= 4.7).slice(0, 6);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity
          style={styles.locationBar}
          activeOpacity={0.7}
          accessibilityLabel="Change delivery location"
        >
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.locationText}>{t.locationLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <Text style={styles.greet}>{t.greeting(firstName)}</Text>
        <Text style={styles.subGreet}>{t.subGreeting}</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchAll(); }} tintColor={COLORS.orange} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active order live-track banner */}
        {activeOrder && (
          <TouchableOpacity
            onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder._id })}
            activeOpacity={0.88}
            style={styles.trackBanner}
          >
            <LinearGradient colors={['#1a1a2e', '#16213e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.trackBannerInner}>
              <Animated.View style={[styles.trackIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="bicycle" size={20} color={COLORS.orange} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>{activeOrder.restaurant?.name || 'Your order'}</Text>
                <Text style={styles.trackSub}>#{formatOrderId(activeOrder._id)} · Tap to track live</Text>
              </View>
              <View style={styles.trackLivePill}>
                <View style={styles.trackLiveDot} />
                <Text style={styles.trackLiveText}>LIVE</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Cuisine category chips */}
        <Animated.View style={[styles.chipsScroll, { opacity: chipSlide, transform: [{ translateY: chipSlide.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CUISINE_KEYS.map((key) => {
            const active = cuisine === key;
            const label  = t.categories[key] || key;
            const icon   = CUISINE_ICONS[key];
            const isEmoji = icon && icon.length > 2;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setCuisine(key)}
                accessibilityLabel={`Filter by ${label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.75}
              >
                {isEmoji
                  ? <Text style={styles.chipEmoji}>{icon}</Text>
                  : <Ionicons name={icon} size={14} color={active ? '#fff' : COLORS.textMuted} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </Animated.View>

        {/* Kebite Pass promo banner */}
        <TouchableOpacity
          onPress={() => setPassOpen(true)}
          activeOpacity={0.88}
          accessibilityLabel="Learn about Kebite Pass free delivery"
          style={styles.passBannerWrap}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.passBanner}
          >
            <View style={styles.passIconWrap}>
              <Ionicons name="infinite" size={22} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passTitle}>{t.passTitle}</Text>
              <Text style={styles.passSub}>{t.passSub}</Text>
            </View>
            <View style={styles.passCtaChip}>
              <Text style={styles.passCta}>{t.passCta}</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.orange} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Featured restaurants — horizontal scroll */}
        {featured.length > 0 && !search && cuisine === 'All' && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHead}>⭐ Top picks</Text>
              <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="See all top picks">
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {featured.map((r) => (
                <TouchableOpacity
                  key={r._id}
                  onPress={() => navigation.navigate('RestaurantDetail', { id: r._id })}
                  activeOpacity={0.88}
                  style={styles.featuredCard}
                >
                  <LinearGradient
                    colors={r.image ? ['transparent', 'rgba(0,0,0,0.55)'] : ['#f97316', '#dc2626']}
                    style={styles.featuredGradient}
                  >
                    {!r.image && (
                      <Ionicons name="restaurant" size={32} color="rgba(255,255,255,0.5)" style={{ marginBottom: SPACING.sm }} />
                    )}
                    <Text style={styles.featuredName} numberOfLines={1}>{r.name}</Text>
                    <View style={styles.featuredMeta}>
                      <Ionicons name="star" size={11} color="#f59e0b" />
                      <Text style={styles.featuredMetaText}>{(r.rating || 4.5).toFixed(1)}</Text>
                      <Text style={styles.featuredDot}>·</Text>
                      <Text style={styles.featuredMetaText}>{r.deliveryTime || '25–35'} min</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section header */}
        <Text style={styles.sectionHead}>
          {search
            ? `Results for "${search}"`
            : cuisine === 'All'
            ? 'All restaurants'
            : `${t.categories[cuisine] || cuisine} restaurants`}
        </Text>

        {/* Content states */}
        {loading && restaurants.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {[1, 2, 3].map((n) => (
              <LoadingSkeleton key={n} height={220} style={{ borderRadius: RADIUS.xl }} />
            ))}
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchAll} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={52} color={COLORS.border} />
            <Text style={styles.emptyText}>No restaurants found</Text>
            {cuisine !== 'All' && (
              <TouchableOpacity onPress={() => setCuisine('All')} style={styles.clearFilter}>
                <Text style={styles.clearFilterText}>Clear filter</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((r) => (
            <RestaurantCard
              key={r._id}
              restaurant={r}
              onPress={() => navigation.navigate('RestaurantDetail', { id: r._id })}
            />
          ))
        )}
      </ScrollView>

      <KebitePassModal visible={passOpen} onClose={() => setPassOpen(false)} navigation={navigation} />
    </View>
  );
}

// ── Kebite Pass modal ──────────────────────────────────────────────────────
const PASS_BENEFITS = [
  { icon: 'bicycle',        text: 'Free delivery on every order' },
  { icon: 'pricetag',       text: 'Exclusive member discounts' },
  { icon: 'flash',          text: 'Priority order queue' },
  { icon: 'headset',        text: 'Dedicated 24/7 support' },
  { icon: 'gift',           text: 'Monthly surprise voucher' },
];

function KebitePassModal({ visible, onClose, navigation }) {
  const [busy, setBusy] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  async function subscribe() {
    setBusy(true);
    try {
      await api.post('/users/me/pass');
      onClose();
      Alert.alert('Welcome to Kebite Pass! 🎉', 'You now enjoy free delivery on every order.');
    } catch (err) {
      Alert.alert('Could not subscribe', err?.response?.data?.message || 'Try again later.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={pass.backdrop}>
        <Animated.View style={[
          pass.card,
          { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }], opacity: slideAnim },
        ]}>
          {/* Header */}
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={pass.header}>
            <TouchableOpacity onPress={onClose} style={pass.closeBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={pass.headerIconWrap}>
              <Ionicons name="infinite" size={36} color={COLORS.orange} />
            </View>
            <Text style={pass.headerTitle}>Kebite Pass</Text>
            <Text style={pass.headerSub}>Free delivery. Every day.</Text>
            <View style={pass.pricePill}>
              <Text style={pass.price}>TSh 9,900</Text>
              <Text style={pass.pricePer}>/month</Text>
            </View>
          </LinearGradient>

          {/* Benefits */}
          <View style={pass.body}>
            {PASS_BENEFITS.map((b) => (
              <View key={b.icon} style={pass.benefitRow}>
                <View style={pass.benefitIcon}>
                  <Ionicons name={b.icon} size={16} color={COLORS.activeOrange} />
                </View>
                <Text style={pass.benefitText}>{b.text}</Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={subscribe}
              disabled={busy}
              activeOpacity={0.88}
              style={{ borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: SPACING.xl }}
            >
              <LinearGradient colors={GRADIENTS.primary} style={pass.subscribeBtn}>
                {busy
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="infinite" size={20} color="#fff" />
                      <Text style={pass.subscribeBtnText}>Get Kebite Pass</Text>
                    </>}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={pass.footnote}>Cancel anytime. No hidden fees.</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop: 52, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg,
  },
  locationBar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm, alignSelf: 'flex-start' },
  locationText: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  greet:    { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  subGreet: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.base, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, marginTop: SPACING.md,
    gap: SPACING.sm, ...SHADOW.sm,
  },
  searchInput: { flex: 1, paddingVertical: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.textPrimary },

  scroll:      { padding: SPACING.lg, paddingTop: 0, paddingBottom: 100 },
  chipsScroll: { marginHorizontal: -SPACING.lg },
  chips: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.activeOrange, borderColor: COLORS.activeOrange },
  chipEmoji:      { fontSize: 14 },
  chipText:       { color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  chipTextActive: { color: '#fff' },

  trackBanner: { marginBottom: SPACING.md, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  trackBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  trackIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  trackTitle:   { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  trackSub:     { color: 'rgba(255,255,255,0.65)', fontSize: FONT_SIZE.xs, marginTop: 2 },
  trackLivePill:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  trackLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  trackLiveText:{ color: '#4ade80', fontSize: 10, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },

  passBannerWrap: { marginBottom: SPACING.xl },
  passBanner: { borderRadius: RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  passIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,0,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  passTitle:   { color: '#fff',  fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  passSub:     { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, marginTop: 2 },
  passCtaChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  passCta:     { color: COLORS.orange, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },

  featuredSection: { marginBottom: SPACING.lg },
  sectionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionHead:     { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark, marginBottom: SPACING.md },
  seeAll:          { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },

  featuredCard: {
    width: 148, height: 110, borderRadius: RADIUS.xl,
    overflow: 'hidden', backgroundColor: COLORS.activeOrange, ...SHADOW.md,
  },
  featuredGradient: { flex: 1, justifyContent: 'flex-end', padding: SPACING.sm, alignItems: 'flex-start' },
  featuredName:     { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  featuredMeta:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  featuredMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: 10 },
  featuredDot:      { color: 'rgba(255,255,255,0.5)' },

  empty:          { alignItems: 'center', marginTop: SPACING.xxxl * 2, gap: SPACING.sm },
  emptyText:      { color: COLORS.textMuted, fontSize: FONT_SIZE.md },
  clearFilter:    { marginTop: SPACING.sm },
  clearFilterText:{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
});

const pass = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.lg },
  card:     { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.lg },
  header:   { padding: SPACING.xl, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: SPACING.md, right: SPACING.md },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,107,0,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.base, marginTop: 4 },
  pricePill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    backgroundColor: 'rgba(255,107,0,0.2)', borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, marginTop: SPACING.md,
  },
  price:    { color: COLORS.orange, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  pricePer: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm },
  body:     { padding: SPACING.xl },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  benefitIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,107,0,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { color: COLORS.textBody, fontSize: FONT_SIZE.base, flex: 1 },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl,
  },
  subscribeBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  footnote: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: SPACING.sm },
});

