import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, ActivityIndicator,
         RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
         StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { formatMoney } from '../../../shared/formatters';
import api from '../../../shared/api';
import { useAuth } from '../context/AuthContext';
import ErrorCard from '../components/ErrorCard';

const EMPTY_FORM = { _id: null, name: '', price: '', category: 'Main', available: true };

export default function Menu() {
  const { user } = useAuth();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [refreshing, setRef]    = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const restaurantId = user?.restaurantId || user?._id;

  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/restaurants/${restaurantId}/menu`);
      setItems(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load menu.');
    } finally {
      setLoading(false); setRef(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  async function toggleAvailability(item) {
    try {
      await api.patch(`/restaurants/${restaurantId}/menu/${item._id}`, { available: !item.available });
      setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, available: !i.available } : i));
    } catch (err) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not update.');
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      _id: item._id,
      name: item.name || '',
      price: String(item.price ?? ''),
      category: item.category ?? 'Main',
      available: item.available !== false,
    });
    setShowForm(true);
  }

  async function saveItem() {
    if (!form.name.trim()) { Alert.alert('Missing name', 'Enter the item name.'); return; }
    const price = Number(form.price);
    if (!price || price <= 0) { Alert.alert('Invalid price', 'Enter a valid price.'); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price,
      category: form.category.trim() || 'Main',
      available: form.available,
    };
    try {
      if (form._id) {
        const res = await api.patch(`/restaurants/${restaurantId}/menu/${form._id}`, payload);
        setItems((prev) => prev.map((i) => i._id === form._id ? res.data : i));
      } else {
        const res = await api.post(`/restaurants/${restaurantId}/menu`, payload);
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
    <View style={{ flex: 1, backgroundColor: BRAND.pageBg }}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity onPress={openAdd} accessibilityLabel="Add item" style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add item</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={BRAND.orange} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchMenu} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); fetchMenu(); }} tintColor={BRAND.orange} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, !item.available && { color: '#999' }]}>{item.name}</Text>
                <Text style={styles.itemCat}>{item.category ?? 'Main'}</Text>
                <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
              </View>
              <View style={styles.itemActions}>
                <Switch
                  value={item.available !== false}
                  onValueChange={() => toggleAvailability(item)}
                  thumbColor="#fff"
                  trackColor={{ false: '#ddd', true: BRAND.orange }}
                  accessibilityLabel={item.available ? 'Mark unavailable' : 'Mark available'}
                />
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  accessibilityLabel={`Edit ${item.name}`}
                  style={styles.editBtn}
                >
                  <Ionicons name="create-outline" size={18} color={BRAND.dark} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="restaurant-outline" size={48} color="#bbb" />
              <Text style={{ color: '#888', marginTop: 12 }}>No menu items yet.</Text>
              <Text style={{ color: '#bbb', marginTop: 4, fontSize: 13 }}>Tap "Add item" to start.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{form._id ? 'Edit item' : 'Add item'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={BRAND.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Item name"
              placeholderTextColor="#aaa"
              style={styles.input}
            />

            <Text style={styles.label}>Price (TSh)</Text>
            <TextInput
              value={form.price}
              onChangeText={(v) => setForm((f) => ({ ...f, price: v.replace(/[^0-9]/g, '') }))}
              placeholder="0"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              value={form.category}
              onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
              placeholder="Main"
              placeholderTextColor="#aaa"
              style={styles.input}
            />

            <View style={styles.availRow}>
              <Text style={styles.availLabel}>Available</Text>
              <Switch
                value={form.available}
                onValueChange={(v) => setForm((f) => ({ ...f, available: v }))}
                thumbColor="#fff"
                trackColor={{ false: '#ddd', true: BRAND.orange }}
              />
            </View>

            <TouchableOpacity
              onPress={saveItem}
              disabled={saving}
              accessibilityLabel="Save item"
              style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 8 }}
            >
              <LinearGradient colors={BRAND.gradientPrimary} style={styles.saveBtn}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveText}>{form._id ? 'Save changes' : 'Add to menu'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { color: '#fff', fontSize: 24, fontWeight: '700' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                 backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8,
                 borderRadius: BRAND.pillRadius },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  card:        { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius, padding: 14,
                 marginBottom: 8, flexDirection: 'row', alignItems: 'center',
                 borderColor: BRAND.cardBorder, borderWidth: 1 },
  itemName:    { fontSize: 16, fontWeight: '600', color: BRAND.dark },
  itemCat:     { color: '#888', fontSize: 12, marginTop: 2 },
  itemPrice:   { color: BRAND.orange, fontWeight: '700', marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn:     { padding: 8, borderRadius: 8, borderColor: BRAND.cardBorder, borderWidth: 1 },
  modalWrap:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                 padding: 20, paddingBottom: 32 },
  modalHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 marginBottom: 12 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: BRAND.dark },
  label:       { color: BRAND.dark, marginBottom: 6, fontWeight: '600', marginTop: 8 },
  input:       { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder,
                 borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  availRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 paddingVertical: 14, marginTop: 8 },
  availLabel:  { color: BRAND.dark, fontSize: 14, fontWeight: '600' },
  saveBtn:     { paddingVertical: 14, alignItems: 'center' },
  saveText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});
