import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND } from '../../../shared/theme';
import { fmtCurrency, fmtAddress } from '../../../shared/formatters';

export default function Properties({ navigation }) {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/properties').then(r => setProperties(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item: p }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PropertyDetail', { id: p._id })} style={styles.card}>
      {p.images?.[0]
        ? <Image source={{ uri: p.images[0] }} style={styles.image} />
        : <View style={[styles.image, { backgroundColor: BRAND.border, justifyContent: 'center', alignItems: 'center' }]}><Ionicons name="image-outline" size={28} color={BRAND.muted} /></View>
      }
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>{p.title}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{p.type}</Text></View>
        </View>
        <Text style={styles.address}><Ionicons name="location-outline" size={12} /> {fmtAddress(p.address)}</Text>
        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.rent}>{fmtCurrency(p.rent?.amount)}<Text style={styles.period}>/mo</Text></Text>
          <Text style={styles.beds}><Ionicons name="bed-outline" size={13} /> {p.bedrooms} bed</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={BRAND.muted} style={{ marginRight: 8 }} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search city or title..."
          style={{ flex: 1, fontSize: 14, color: BRAND.text }} />
      </View>
      {loading ? <ActivityIndicator color={BRAND.primary} style={{ marginTop: 40 }} />
        : <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => i._id}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: BRAND.muted, marginTop: 40 }}>No properties found.</Text>}
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.surface, margin: 12, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BRAND.border },
  card: { backgroundColor: BRAND.surface, borderRadius: 12, overflow: 'hidden', ...BRAND.shadow },
  image: { width: '100%', height: 150 },
  info: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: BRAND.text, flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: BRAND.primary, fontWeight: '600' },
  address: { fontSize: 12, color: BRAND.muted, marginTop: 4 },
  rent: { fontSize: 16, fontWeight: '700', color: BRAND.primary },
  period: { fontSize: 12, fontWeight: '400', color: BRAND.muted },
  beds: { fontSize: 13, color: BRAND.muted },
});
