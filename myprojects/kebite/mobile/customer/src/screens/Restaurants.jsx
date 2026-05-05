import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator,
         ScrollView, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import api from '../../../shared/api';
import ErrorCard from '../components/ErrorCard';

const DEFAULT_CATS = ['All', 'Biryani', 'Burgers', 'Pizza', 'Chicken', 'Local', 'Drinks'];

export default function Restaurants({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get('/restaurants');
        if (active) setRestaurants(res.data || []);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load restaurants.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATS);
    restaurants.forEach((r) => (r.categories || []).forEach((c) => set.add(c)));
    return Array.from(set);
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesCat = category === 'All' || (r.categories || []).includes(category);
      const matchesSearch = !q || (r.name || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [restaurants, search, category]);

  function isOpen(r) {
    if (typeof r.isOpen === 'boolean') return r.isOpen;
    if (typeof r.open === 'boolean')   return r.open;
    return true;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <Text style={styles.title}>Restaurants</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#888" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}
                  contentContainerStyle={{ paddingHorizontal: 12 }}>
        {categories.map((c) => {
          const active = category === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              accessibilityLabel={`Filter ${c}`}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={BRAND.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={() => navigation.replace('Restaurants')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('RestaurantDetail', { id: item._id })}
              accessibilityLabel={`Open ${item.name}`}
              style={styles.card}
            >
              <View style={styles.imgWrap}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.img} onError={() => {}} />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]}>
                    <Text style={styles.imgEmoji}>🍽️</Text>
                  </View>
                )}
                <View style={[styles.openBadge, !isOpen(item) && { backgroundColor: '#999' }]}>
                  <Text style={styles.openBadgeText}>{isOpen(item) ? 'Open' : 'Closed'}</Text>
                </View>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={14} color={BRAND.orange} />
                  <Text style={styles.meta}>{item.rating?.toFixed(1) || '4.5'}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.meta}>{item.deliveryTime || '25–35 min'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
              Hakuna restaurants {/* SW: no restaurants */}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BRAND.pageBg },
  header:          { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  title:           { color: '#fff', fontSize: 24, fontWeight: '700' },
  searchRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: BRAND.pillRadius, paddingHorizontal: 14, paddingVertical: 10,
                     marginTop: 14, gap: 8 },
  searchInput:     { flex: 1, color: BRAND.dark, fontSize: 14, padding: 0 },
  chipRow:         { paddingVertical: 12, maxHeight: 56, flexGrow: 0 },
  chip:            { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4,
                     backgroundColor: '#fff', borderRadius: BRAND.pillRadius,
                     borderColor: BRAND.cardBorder, borderWidth: 1 },
  chipActive:      { backgroundColor: BRAND.orange, borderColor: BRAND.orange },
  chipText:        { color: BRAND.dark, fontWeight: '600', fontSize: 13 },
  chipTextActive:  { color: '#fff' },
  card:            { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius, marginBottom: 12,
                     overflow: 'hidden', borderColor: BRAND.cardBorder, borderWidth: 1 },
  imgWrap:         { position: 'relative' },
  img:             { width: '100%', height: 140, backgroundColor: '#eee' },
  imgPlaceholder:  { alignItems: 'center', justifyContent: 'center' },
  imgEmoji:        { fontSize: 44 },
  openBadge:       { position: 'absolute', top: 10, left: 10, backgroundColor: '#16a34a',
                     paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  openBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  name:            { fontSize: 16, fontWeight: '700', color: BRAND.dark },
  metaRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  meta:            { color: '#666', fontSize: 13 },
  dot:             { color: '#bbb', marginHorizontal: 4 },
});
