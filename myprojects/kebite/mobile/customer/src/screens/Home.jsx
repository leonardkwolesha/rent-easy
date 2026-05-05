import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, RefreshControl, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, BRAND, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney } from '../../../shared/formatters';
import api from '../../../shared/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import ErrorCard from '../components/ErrorCard';
import RestaurantCard from '../../../shared/components/RestaurantCard';
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton';

const CUISINE_KEYS = ['All', 'Tanzanian', 'Pizza', 'Seafood', 'Chicken', 'BBQ', 'Healthy', 'Burgers', 'Desserts'];

function matchesCuisine(restaurant, cuisine) {
  if (cuisine === 'All') return true;
  const hay = `${restaurant.cuisine || ''} ${restaurant.cuisineType || ''} ${restaurant.name || ''}`.toLowerCase();
  return hay.includes(cuisine.toLowerCase());
}

export default function Home({ navigation }) {
  const { user }          = useAuth();
  const { t }             = useLang();
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState('All');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [refreshing, setRefresh]      = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load restaurants.');
    } finally {
      setLoading(false); setRefresh(false);
    }
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const filtered = restaurants.filter((r) => {
    const matchSearch = !search.trim() ||
      r.name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && matchesCuisine(r, cuisine);
  });

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        {/* Location bar */}
        <View style={styles.locationBar}>
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.locationText}>{t.locationLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
        </View>

        {/* Greeting */}
        <Text style={styles.greet}>{t.greeting(firstName)}</Text>
        <Text style={styles.subGreet}>{t.subGreeting}</Text>

        {/* Search bar */}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefresh(true); fetchRestaurants(); }}
            tintColor={COLORS.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cuisine category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {CUISINE_KEYS.map((key) => {
            const active = cuisine === key;
            const label  = t.categories[key] || key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setCuisine(key)}
                accessibilityLabel={`Filter by ${label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Kebite Pass promo banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          accessibilityLabel="Learn about Kebite Pass free delivery"
          style={styles.passBannerWrap}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.passBanner}
          >
            <View style={styles.passIcon}>
              <Ionicons name="infinite" size={22} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passTitle}>{t.passTitle}</Text>
              <Text style={styles.passSub}>{t.passSub}</Text>
            </View>
            <Text style={styles.passCta}>{t.passCta}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Section header */}
        <Text style={styles.sectionHead}>
          {cuisine === 'All' ? 'All restaurants' : `${t.categories[cuisine] || cuisine} restaurants`}
        </Text>

        {/* Content states */}
        {loading && restaurants.length === 0 ? (
          <View style={{ gap: SPACING.md }}>
            {[1, 2, 3].map((n) => (
              <LoadingSkeleton key={n} height={220} style={{ borderRadius: RADIUS.xl }} />
            ))}
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchRestaurants} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pageBg },

  header: {
    paddingTop:        52,
    paddingBottom:     SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginBottom:  SPACING.sm,
  },
  locationText: {
    color:      'rgba(255,255,255,0.85)',
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  greet:    { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  subGreet: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.base, marginTop: 2 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#fff',
    borderRadius:      RADIUS.xl,
    paddingHorizontal: SPACING.md,
    marginTop:         SPACING.md,
    gap:               SPACING.sm,
    ...SHADOW.sm,
  },
  searchInput: {
    flex:           1,
    paddingVertical:SPACING.md,
    fontSize:       FONT_SIZE.base,
    color:          COLORS.textPrimary,
  },

  scroll:      { padding: SPACING.lg, paddingTop: 0, paddingBottom: 100 },
  chipsScroll: { marginHorizontal: -SPACING.lg, flexShrink: 0 },
  chips: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    gap:               SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    borderRadius:      RADIUS.pill,
    backgroundColor:   COLORS.cardBg,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.activeOrange, borderColor: COLORS.activeOrange },
  chipText:       { color: COLORS.textBody, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  chipTextActive: { color: '#fff' },

  passBannerWrap: { marginBottom: SPACING.xl },
  passBanner: {
    borderRadius:      RADIUS.xl,
    padding:           SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    overflow:          'hidden',
  },
  passIcon: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255,107,0,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  passTitle: { color: '#fff',  fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  passSub:   { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, marginTop: 2 },
  passCta:   { color: COLORS.orange, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold,
               textAlign: 'right' },

  sectionHead: {
    fontSize:     FONT_SIZE.lg,
    fontWeight:   FONT_WEIGHT.bold,
    color:        COLORS.dark,
    marginBottom: SPACING.md,
  },

  empty:          { alignItems: 'center', marginTop: SPACING.xxxl * 2, gap: SPACING.sm },
  emptyText:      { color: COLORS.textMuted, fontSize: FONT_SIZE.md },
  clearFilter:    { marginTop: SPACING.sm },
  clearFilterText:{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
});
