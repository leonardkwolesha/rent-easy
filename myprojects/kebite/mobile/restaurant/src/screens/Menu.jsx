import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, ActivityIndicator,
         RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
         StyleSheet, Alert, Animated, Image, ScrollView, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW, tabBar } from 'shared/theme';
import { formatMoney } from 'shared/formatters';
import api from 'shared/api';
import ErrorCard from '../components/ErrorCard';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';
const CATEGORIES = ['Tanzanian', 'Chicken', 'Burgers', 'Pizza', 'Seafood', 'BBQ', 'Healthy', 'Desserts', 'Drinks', 'Starters', 'Sides', 'Specials'];
const DIETARY_TAGS = ['Halal', 'Vegan', 'Vegetarian', 'Spicy', 'Gluten-Free', 'Best Seller', 'New'];
const EMPTY_FORM = { _id: null, name: '', price: '', category: 'Tanzanian', description: '', isAvailable: true, tags: [], imageUri: null, imageUrl: null };

function SkeletonItem() {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [op]);
  const box = (w, h = 14) => ({ width: w, height: h, borderRadius: 6, backgroundColor: COLORS.border });
  return (
    <Animated.View style={[styles.card, { opacity: op }]}>
      <View style={{ flex: 1, gap: SPACING.sm }}>
        <View style={box('60%', 16)} />
        <View style={box('30%')} />
        <View style={box('25%')} />
      </View>
      <View style={{ width: 68, height: 28, borderRadius: RADIUS.pill, backgroundColor: COLORS.border }} />
    </Animated.View>
  );
}

export default function Menu() {
  const insets = useSafeAreaInsets();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [refreshing, setRef]    = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const fetchMenu = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await api.get('/restaurant/me');
      setItems(res.data?.menu || []);
    } catch (err) {
      console.error('[Menu] fetch error:', err?.response?.data ?? err.message);
      if (!silent) setError(err?.response?.data?.message || 'Could not load menu.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  async function toggleAvailability(item) {
    // Optimistic update
    setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i));
    try {
      await api.put(`/restaurant/me/menu/${item._id}`, { isAvailable: !item.isAvailable });
    } catch (err) {
      // Revert on failure
      setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, isAvailable: item.isAvailable } : i));
      Alert.alert('Failed', err?.response?.data?.message || 'Could not update availability.');
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      _id:         item._id,
      name:        item.name || '',
      price:       String(item.price ?? ''),
      category:    CATEGORIES.includes(item.category) ? item.category : 'Tanzanian',
      description: item.description || '',
      isAvailable: item.isAvailable !== false,
      tags:        Array.isArray(item.tags) ? item.tags : [],
      imageUri:    null,
      imageUrl:    item.imageUrl || null,
    });
    setShowForm(true);
  }

  function confirmDelete(item) {
    Alert.alert(
      'Hide item',
      `"${item.name}" will be hidden from customers. You can re-enable it any time.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/restaurant/me/menu/${item._id}`);
              setItems((prev) => prev.filter((i) => i._id !== item._id));
            } catch (err) {
              Alert.alert('Failed', err?.response?.data?.message || 'Could not remove item.');
            }
          },
        },
      ]
    );
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add a food image.');
      return;
    }
    // Close the form Modal first so Android can deliver the picker Activity result back correctly
    setShowForm(false);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:    ['images'],
        allowsEditing: true,
        aspect:        [4, 3],
        quality:       0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setForm((f) => ({ ...f, imageUri: result.assets[0].uri, imageUrl: null }));
      }
    } catch {
      Alert.alert('Photo library', 'Could not open photo library. Please try again.');
    } finally {
      setShowForm(true);
    }
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  async function saveItem() {
    if (!form.name.trim()) { Alert.alert('Missing name', 'Enter the item name.'); return; }
    const price = Number(form.price);
    if (!price || price <= 0) { Alert.alert('Invalid price', 'Enter a valid price in TSh.'); return; }

    setSaving(true);
    try {
      let uploadedImageUrl = form.imageUrl;

      if (form.imageUri) {
        const fd = new FormData();
        fd.append('image', {
          uri:  form.imageUri,
          name: 'food.jpg',
          type: 'image/jpeg',
        });
        try {
          const upRes = await api.post('/restaurant/me/menu/upload', fd, {
            headers:          { 'Content-Type': 'multipart/form-data' },
            transformRequest: [(d) => d],
          });
          uploadedImageUrl = upRes.data?.imageUrl || null;
        } catch {
          // Upload failed — proceed without image
        }
      }

      const payload = {
        name:        form.name.trim(),
        price,
        category:    form.category,
        description: form.description.trim(),
        isAvailable: form.isAvailable,
        tags:        form.tags,
        ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
      };

      if (form._id) {
        const res = await api.put(`/restaurant/me/menu/${form._id}`, payload);
        setItems((prev) => prev.map((i) => i._id === form._id ? res.data : i));
      } else {
        const res = await api.post('/restaurant/me/menu', payload);
        setItems((prev) => [...prev, res.data]);
      }
      setShowForm(false);
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not save item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <LinearGradient colors={[NAVY, NAVY2]} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity onPress={openAdd} accessibilityLabel="Add item" style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add item</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading && items.length === 0 ? (
        <View style={{ padding: SPACING.lg }}>
          {[1, 2, 3, 4].map((k) => <SkeletonItem key={k} />)}
        </View>
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchMenu} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRef(true); fetchMenu(); }}
              tintColor={COLORS.orange}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openEdit(item)}
              activeOpacity={0.8}
              accessibilityLabel={`Edit ${item.name}`}
              style={[styles.card, !item.isAvailable && styles.cardDisabled]}
            >
              {/* Food image or placeholder */}
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemThumb}
                  resizeMode="cover"
                  onError={() => {}}
                />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
                  <Ionicons name="restaurant-outline" size={22} color={COLORS.textLight} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, !item.isAvailable && { color: COLORS.textLight }]}>
                  {item.name}
                </Text>
                <Text style={styles.itemCat}>{item.category ?? 'Main'}</Text>
                {!!item.description && (
                  <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                )}
                <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
              </View>

              <View style={styles.itemActions}>
                <Switch
                  value={item.isAvailable !== false}
                  onValueChange={() => toggleAvailability(item)}
                  thumbColor="#fff"
                  trackColor={{ false: COLORS.border, true: COLORS.orange }}
                  accessibilityLabel={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                />
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); confirmDelete(item); }}
                  accessibilityLabel={`Remove ${item.name}`}
                  style={[styles.iconBtn, { borderColor: COLORS.errorBg }]}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.errorText} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60, gap: SPACING.md }}>
              <Ionicons name="restaurant-outline" size={56} color={COLORS.border} />
              <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold }}>
                No menu items yet
              </Text>
              <Text style={{ color: COLORS.textLight, fontSize: FONT_SIZE.sm }}>
                Tap "Add item" to add your first dish
              </Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity
        onPress={openAdd}
        accessibilityLabel="Add menu item"
        activeOpacity={0.88}
        style={[styles.fab, { bottom: Math.max(insets.bottom, tabBar.bottomGap) + tabBar.height + 16 }]}
      >
        <LinearGradient colors={[COLORS.orange, COLORS.red]} style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showForm}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowForm(false)}
      >
        {/* Backdrop — tap to dismiss */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowForm(false)}
        />

        {/* Sheet pinned to screen bottom — zero gap */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <View style={[styles.modalCard, { maxHeight: SCREEN_HEIGHT * 0.92, paddingBottom: 0 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{form._id ? 'Edit item' : 'Add item'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            >
              {/* Image picker */}
              <Text style={styles.label}>Food photo</Text>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imgPickerWrap}>
                {(form.imageUri || form.imageUrl) ? (
                  <View>
                    <Image
                      source={{ uri: form.imageUri || form.imageUrl }}
                      style={styles.imgPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setForm((f) => ({ ...f, imageUri: null, imageUrl: null }))}
                      accessibilityLabel="Remove image"
                      style={styles.imgRemove}
                    >
                      <Ionicons name="close-circle" size={22} color={COLORS.errorText} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imgPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.textLight} />
                    <Text style={styles.imgPlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Item name"
                placeholderTextColor="#aaa"
                style={styles.input}
              />

              <Text style={styles.label}>Price (TSh) *</Text>
              <TextInput
                value={form.price}
                onChangeText={(v) => setForm((f) => ({ ...f, price: v.replace(/[^0-9]/g, '') }))}
                placeholder="e.g. 5000"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const active = form.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                      activeOpacity={0.8}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Short description"
                placeholderTextColor="#aaa"
                multiline
                style={[styles.input, { minHeight: 56 }]}
              />

              <Text style={styles.label}>Dietary tags</Text>
              <View style={styles.tagRow}>
                {DIETARY_TAGS.map((tag) => {
                  const active = form.tags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.8}
                      style={[styles.tagChip, active && styles.tagChipActive]}
                    >
                      <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.availRow}>
                <Text style={styles.availLabel}>Available to order</Text>
                <Switch
                  value={form.isAvailable}
                  onValueChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
                  thumbColor="#fff"
                  trackColor={{ false: COLORS.border, true: COLORS.orange }}
                />
              </View>

              <TouchableOpacity
                onPress={saveItem}
                disabled={saving}
                accessibilityLabel="Save item"
                style={{ borderRadius: 14, overflow: 'hidden', marginTop: SPACING.md, marginBottom: SPACING.sm }}
              >
                <LinearGradient colors={[COLORS.orange, COLORS.red]} style={styles.saveBtn}>
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.saveText}>{form._id ? 'Save changes' : 'Add to menu'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { paddingTop: 0, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { color: '#fff', fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
                 backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.md,
                 paddingVertical: SPACING.sm, borderRadius: RADIUS.pill },
  addBtnText:  { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  card:        { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.md,
                 marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center',
                 gap: SPACING.sm, ...SHADOW.sm },
  cardDisabled:{ opacity: 0.6 },
  itemThumb:   { width: 64, height: 64, borderRadius: RADIUS.md, flexShrink: 0 },
  itemThumbEmpty: {
    backgroundColor: COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemName:    { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: COLORS.dark },
  itemCat:     { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  itemDesc:    { color: COLORS.textBody, fontSize: FONT_SIZE.sm, marginTop: 4 },
  itemPrice:   { color: COLORS.orange, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.xs, fontSize: FONT_SIZE.base },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn:     { padding: SPACING.sm, borderRadius: RADIUS.md, borderColor: COLORS.border, borderWidth: 1 },

  fab:         { position: 'absolute', bottom: 0, right: SPACING.lg },
  fabInner:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
                 ...SHADOW.lg },

  modalWrap:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard:   { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
                 padding: SPACING.lg },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
                 alignSelf: 'center', marginBottom: SPACING.md },
  modalHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 marginBottom: SPACING.md },
  modalTitle:  { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  label:       { color: COLORS.dark, marginBottom: 6, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.sm },
  input:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, borderColor: COLORS.border,
                 borderWidth: 1, padding: 14, fontSize: FONT_SIZE.lg, color: COLORS.dark },
  availRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 paddingVertical: 14, marginTop: SPACING.sm },
  availLabel:  { color: COLORS.dark, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  saveBtn:     { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  saveText:    { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },

  imgPickerWrap: { marginBottom: SPACING.sm },
  imgPreview:    { width: '100%', height: 120, borderRadius: RADIUS.md },
  imgRemove:     { position: 'absolute', top: 6, right: 6 },
  imgPlaceholder:{
    width: '100%', height: 120, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.pageBg,
  },
  imgPlaceholderText: { color: COLORS.textLight, fontSize: FONT_SIZE.sm },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  catChip:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
                 borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border,
                 backgroundColor: COLORS.pageBg },
  catChipActive:     { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  catChipText:       { color: COLORS.textBody, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  catChipTextActive: { color: '#fff', fontWeight: FONT_WEIGHT.bold },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  tagChip:     { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
                 borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border,
                 backgroundColor: COLORS.pageBg },
  tagChipActive:     { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  tagChipText:       { color: COLORS.textBody, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  tagChipTextActive: { color: '#fff', fontWeight: FONT_WEIGHT.bold },
});
