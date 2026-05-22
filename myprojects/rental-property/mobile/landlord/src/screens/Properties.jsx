import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal,
  TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency } from '../../../shared/formatters';

const TYPES = ['apartment', 'house', 'room', 'studio', 'hostel', 'commercial'];
const EMPTY_FORM = {
  title: '', type: 'apartment', rentAmount: '', deposit: '',
  bedrooms: '1', bathrooms: '1', street: '', area: '', city: '',
  description: '', amenities: '',
};

export default function Properties() {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/properties/my')
    .then(r => setProperties(r.data.data))
    .catch(() => {})
    .finally(() => setLoading(false));

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openAdd = () => {
    setForm(EMPTY_FORM); setEditId(null);
    setExistingImages([]); setNewImages([]);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      title: p.title || '', type: p.type || 'apartment',
      rentAmount: String(p.rent?.amount || ''), deposit: String(p.deposit || ''),
      bedrooms: String(p.bedrooms || '1'), bathrooms: String(p.bathrooms || '1'),
      street: p.address?.street || '', area: p.address?.area || '', city: p.address?.city || '',
      description: p.description || '', amenities: (p.amenities || []).join(', '),
    });
    setExistingImages(p.images || []);
    setNewImages([]);
    setEditId(p._id);
    setShowForm(true);
  };

  const pickImages = async () => {
    const total = existingImages.length + newImages.length;
    if (total >= 10) return Alert.alert('Limit reached', 'Maximum 10 images per property.');

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission needed', 'Allow photo library access to upload images.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - total,
    });
    if (!result.canceled) {
      setNewImages(prev => [...prev, ...result.assets].slice(0, 10 - existingImages.length));
    }
  };

  const uploadImages = async (propertyId, images) => {
    if (!images.length) return;
    const formData = new FormData();
    for (const img of images) {
      const filename = img.uri.split('/').pop();
      const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
      // iOS camera saves as HEIC by default — normalize to JPEG so the
      // iOS networking layer transcodes it and the server accepts it.
      const isHeic = ext === 'heic' || ext === 'heif';
      const safeName = isHeic ? filename.replace(/\.(heic|heif)$/i, '.jpg') : filename;
      const type     = isHeic || ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      formData.append('images', { uri: img.uri, name: safeName, type });
    }
    await api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.city.trim() || !form.rentAmount) {
      return Alert.alert('Error', 'Title, city and rent amount are required.');
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      type: form.type,
      rent: { amount: Number(form.rentAmount), currency: 'TZS', period: 'monthly' },
      deposit: Number(form.deposit) || 0,
      bedrooms: Number(form.bedrooms) || 1,
      bathrooms: Number(form.bathrooms) || 1,
      address: { street: form.street.trim(), area: form.area.trim(), city: form.city.trim() },
      description: form.description.trim(),
      amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      images: existingImages,
    };
    try {
      let propertyId = editId;
      if (editId) {
        await api.put(`/properties/${editId}`, body);
      } else {
        const { data } = await api.post('/properties', body);
        propertyId = data.data._id;
      }
      if (newImages.length > 0) {
        await uploadImages(propertyId, newImages);
      }
      Alert.alert('Saved', editId ? 'Property updated.' : 'Property listed successfully.');
      setShowForm(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save property.');
    }
    setSaving(false);
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Property', `Remove "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/properties/${id}`); load(); }
        catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed.'); }
      }},
    ]);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const counter = (key, min = 0) => (
    <View style={styles.counter}>
      <TouchableOpacity onPress={() => set(key, String(Math.max(min, Number(form[key]) - 1)))} style={styles.counterBtn}>
        <Ionicons name="remove" size={18} color={BRAND.primary} />
      </TouchableOpacity>
      <Text style={styles.counterVal}>{form[key]}</Text>
      <TouchableOpacity onPress={() => set(key, String(Number(form[key]) + 1))} style={styles.counterBtn}>
        <Ionicons name="add" size={18} color={BRAND.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item: p }) => {
    const s = STATUS_COLORS[p.status] || STATUS_COLORS.available;
    return (
      <View style={styles.card}>
        {p.images?.[0] ? (
          <Image source={{ uri: p.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Ionicons name="camera-outline" size={28} color={BRAND.muted} />
            <Text style={styles.imagePlaceholderText}>No photos</Text>
          </View>
        )}
        {p.images?.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={12} color="#fff" />
            <Text style={styles.imageCountText}>{p.images.length}</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.cardSub}>{p.address?.city}{p.address?.area ? ` · ${p.address.area}` : ''} · {p.type}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: s.bg }]}>
              <Text style={[styles.badgeText, { color: s.text }]}>{p.status}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Ionicons name="cash-outline" size={13} color={BRAND.secondary} /><Text style={styles.statTxt}>{fmtCurrency(p.rent?.amount)}/mo</Text></View>
            <View style={styles.stat}><Ionicons name="bed-outline" size={13} color={BRAND.muted} /><Text style={styles.statTxt}>{p.bedrooms} bed</Text></View>
            <View style={styles.stat}><Ionicons name="water-outline" size={13} color={BRAND.muted} /><Text style={styles.statTxt}>{p.bathrooms} bath</Text></View>
          </View>
          {p.deposit > 0 && <Text style={styles.deposit}>Deposit: {fmtCurrency(p.deposit)}</Text>}
          {p.amenities?.length > 0 && (
            <View style={styles.amenitiesRow}>
              {p.amenities.slice(0, 3).map(a => (
                <View key={a} style={styles.amenityChip}><Text style={styles.amenityText}>{a}</Text></View>
              ))}
              {p.amenities.length > 3 && <Text style={styles.moreAmenities}>+{p.amenities.length - 3} more</Text>}
            </View>
          )}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => openEdit(p)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={15} color={BRAND.primary} />
              <Text style={[styles.actionText, { color: BRAND.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(p._id, p.title)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={15} color={BRAND.danger} />
              <Text style={[styles.actionText, { color: BRAND.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg, paddingTop: insets.top }}>
      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 12, gap: 14, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        ListEmptyComponent={!loading && (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={52} color={BRAND.border} />
            <Text style={styles.emptyTitle}>No Properties Yet</Text>
            <Text style={styles.emptySub}>Tap + to list your first property</Text>
          </View>
        )}
      />
      <TouchableOpacity onPress={openAdd} style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={BRAND.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editId ? 'Edit Property' : 'Add Property'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnTxt}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Images section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PHOTOS ({existingImages.length + newImages.length}/10)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                <View style={styles.imagesRow}>
                  {/* Pick button */}
                  <TouchableOpacity onPress={pickImages} style={styles.addImageBtn}>
                    <Ionicons name="camera-outline" size={26} color={BRAND.primary} />
                    <Text style={styles.addImageTxt}>Add</Text>
                  </TouchableOpacity>
                  {/* Existing images */}
                  {existingImages.map((uri, i) => (
                    <View key={`ex-${i}`} style={styles.thumb}>
                      <Image source={{ uri }} style={styles.thumbImg} />
                      <TouchableOpacity onPress={() => setExistingImages(prev => prev.filter((_, j) => j !== i))} style={styles.thumbRemove}>
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      </TouchableOpacity>
                      <View style={styles.savedLabel}><Text style={styles.savedLabelTxt}>SAVED</Text></View>
                    </View>
                  ))}
                  {/* New images */}
                  {newImages.map((img, i) => (
                    <View key={`new-${i}`} style={styles.thumb}>
                      <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                      <TouchableOpacity onPress={() => setNewImages(prev => prev.filter((_, j) => j !== i))} style={styles.thumbRemove}>
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      </TouchableOpacity>
                      <View style={[styles.savedLabel, { backgroundColor: BRAND.accent }]}><Text style={styles.savedLabelTxt}>NEW</Text></View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.imgHint}>Up to 10 photos. Tap × to remove.</Text>
            </View>

            {/* Basic info */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BASIC INFO</Text>
              <Text style={styles.fieldLabel}>Property Title *</Text>
              <TextInput value={form.title} onChangeText={v => set('title', v)} placeholder="e.g. Spacious 2-Bedroom Apartment" style={styles.input} />
              <Text style={styles.fieldLabel}>Property Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {TYPES.map(t => (
                    <TouchableOpacity key={t} onPress={() => set('type', t)} style={[styles.chip, form.type === t && styles.chipActive]}>
                      <Text style={[styles.chipTxt, form.type === t && styles.chipTxtActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRICING</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Rent / Month (TZS) *</Text>
                  <TextInput value={form.rentAmount} onChangeText={v => set('rentAmount', v)} placeholder="350000" keyboardType="numeric" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Deposit (TZS)</Text>
                  <TextInput value={form.deposit} onChangeText={v => set('deposit', v)} placeholder="700000" keyboardType="numeric" style={styles.input} />
                </View>
              </View>
            </View>

            {/* Details */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DETAILS</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Bedrooms</Text>{counter('bedrooms', 0)}</View>
                <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Bathrooms</Text>{counter('bathrooms', 1)}</View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOCATION</Text>
              <Text style={styles.fieldLabel}>Street</Text>
              <TextInput value={form.street} onChangeText={v => set('street', v)} placeholder="e.g. 12 Msimbazi Street" style={styles.input} />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Area / District</Text><TextInput value={form.area} onChangeText={v => set('area', v)} placeholder="Kariakoo" style={styles.input} /></View>
                <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>City *</Text><TextInput value={form.city} onChangeText={v => set('city', v)} placeholder="Dar es Salaam" style={styles.input} /></View>
              </View>
            </View>

            {/* Description & Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DESCRIPTION & AMENITIES</Text>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput value={form.description} onChangeText={v => set('description', v)} placeholder="Describe your property..." multiline numberOfLines={4} style={[styles.input, { height: 90, textAlignVertical: 'top' }]} />
              <Text style={styles.fieldLabel}>Amenities (comma-separated)</Text>
              <TextInput value={form.amenities} onChangeText={v => set('amenities', v)} placeholder="WiFi, Parking, Security, Generator" style={styles.input} />
            </View>
            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BRAND.surface, borderRadius: 16, overflow: 'hidden', ...BRAND.shadow },
  cardImage: { width: '100%', height: 180 },
  imagePlaceholder: { backgroundColor: BRAND.border, justifyContent: 'center', alignItems: 'center', gap: 6 },
  imagePlaceholderText: { fontSize: 12, color: BRAND.muted },
  imageCountBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  imageCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: BRAND.text },
  cardSub: { fontSize: 12, color: BRAND.muted, marginTop: 2, textTransform: 'capitalize' },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 14, paddingVertical: 10, borderTopWidth: 1, borderColor: BRAND.border },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTxt: { fontSize: 12, color: BRAND.muted, fontWeight: '500' },
  deposit: { fontSize: 12, color: BRAND.muted, marginTop: 4, marginBottom: 6 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10, marginTop: 4 },
  amenityChip: { backgroundColor: BRAND.secondary + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  amenityText: { fontSize: 11, color: BRAND.secondary, fontWeight: '600' },
  moreAmenities: { fontSize: 11, color: BRAND.muted, alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 9, backgroundColor: BRAND.primary + '12', borderWidth: 1, borderColor: BRAND.primary + '30' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 9, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: BRAND.text, marginTop: 14 },
  emptySub: { fontSize: 13, color: BRAND.muted, marginTop: 6 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: BRAND.primary, justifyContent: 'center', alignItems: 'center', shadowColor: BRAND.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 },
  modal: { flex: 1, backgroundColor: BRAND.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, backgroundColor: BRAND.surface, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  saveBtn: { backgroundColor: BRAND.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  formScroll: { flex: 1 },
  section: { backgroundColor: BRAND.surface, margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, ...BRAND.shadow },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: BRAND.muted, letterSpacing: 1, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.border, padding: 11, fontSize: 14, color: BRAND.text },
  row2: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: BRAND.border, backgroundColor: BRAND.bg },
  chipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  chipTxt: { fontSize: 13, fontWeight: '500', color: BRAND.muted, textTransform: 'capitalize' },
  chipTxtActive: { color: '#fff' },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.border, overflow: 'hidden' },
  counterBtn: { padding: 10 },
  counterVal: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: BRAND.text },
  imagesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 4, paddingVertical: 4 },
  addImageBtn: { width: 88, height: 88, borderRadius: 12, borderWidth: 2, borderColor: BRAND.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4, backgroundColor: BRAND.primary + '08' },
  addImageTxt: { fontSize: 11, fontWeight: '700', color: BRAND.primary },
  thumb: { width: 88, height: 88, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4 },
  savedLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 2, alignItems: 'center' },
  savedLabelTxt: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  imgHint: { fontSize: 11, color: BRAND.muted, marginTop: 8 },
});
