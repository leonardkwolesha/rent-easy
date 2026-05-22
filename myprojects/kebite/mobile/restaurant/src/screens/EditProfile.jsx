import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from 'shared/theme';
import api from 'shared/api';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';

const CUISINE_OPTIONS = [
  'Burgers', 'Swahili', 'Pizza', 'Chicken', 'Seafood',
  'Healthy', 'Desserts', 'Drinks', 'Other',
];

function CuisinePicker({ selected, onSelect }) {
  return (
    <View style={styles.pickerWrap}>
      {CUISINE_OPTIONS.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
            style={[styles.pickerChip, active && styles.pickerChipActive]}
          >
            <Text style={[styles.pickerChipText, active && styles.pickerChipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EditProfile({ route, navigation }) {
  const { restaurant } = route.params || {};

  const existingCuisine = Array.isArray(restaurant?.cuisine) && restaurant.cuisine.length
    ? restaurant.cuisine[0]
    : (typeof restaurant?.cuisine === 'string' ? restaurant.cuisine : '');

  const [form, setForm] = useState({
    name:         restaurant?.name         || '',
    description:  restaurant?.description  || '',
    cuisine:      existingCuisine,
    address:      restaurant?.location?.address || '',
    phone:        restaurant?.phone        || '',
    minOrder:     restaurant?.minOrder     ? String(restaurant.minOrder)     : '',
    deliveryFee:  restaurant?.deliveryFee  ? String(restaurant.deliveryFee)  : '',
    deliveryTime: restaurant?.deliveryTime ? String(restaurant.deliveryTime) : '',
  });
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  const save = useCallback(async () => {
    if (!form.name.trim())    { Alert.alert('Required', 'Restaurant name is required.'); return; }
    if (!form.cuisine)        { Alert.alert('Required', 'Please select a cuisine type.'); return; }
    if (!form.address.trim()) { Alert.alert('Required', 'Address is required.'); return; }

    setSaving(true);
    try {
      const payload = {
        name:         form.name.trim(),
        description:  form.description.trim(),
        cuisine:      [form.cuisine],
        address:      form.address.trim(),
        phone:        form.phone.trim(),
        minOrder:     form.minOrder     ? Number(form.minOrder)     : 0,
        deliveryFee:  form.deliveryFee  ? Number(form.deliveryFee)  : 0,
        deliveryTime: form.deliveryTime ? Number(form.deliveryTime) : 30,
      };
      await api.put('/restaurant/me', payload);
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }, [form, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic info */}
          <SectionLabel text="RESTAURANT INFO" />

          <FieldLabel text="Restaurant name *" />
          <TextInput
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="e.g. Mama's Kitchen"
            placeholderTextColor="#aaa"
            style={styles.input}
          />

          <FieldLabel text="Short description" />
          <TextInput
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="What makes your restaurant special?"
            placeholderTextColor="#aaa"
            multiline
            maxLength={200}
            style={[styles.input, { minHeight: 72 }]}
          />

          <FieldLabel text="Cuisine type *" />
          <CuisinePicker selected={form.cuisine} onSelect={(v) => set('cuisine', v)} />

          {/* Contact */}
          <SectionLabel text="CONTACT" />

          <FieldLabel text="Phone number" />
          <TextInput
            value={form.phone}
            onChangeText={(v) => set('phone', v.replace(/[^0-9+]/g, ''))}
            placeholder="+255 7XX XXX XXX"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <FieldLabel text="Address *" />
          <TextInput
            value={form.address}
            onChangeText={(v) => set('address', v)}
            placeholder="Street, area, city"
            placeholderTextColor="#aaa"
            multiline
            style={[styles.input, { minHeight: 56 }]}
          />

          {/* Operations */}
          <SectionLabel text="OPERATIONS" />

          <FieldLabel text="Average prep time (minutes)" />
          <TextInput
            value={form.deliveryTime}
            onChangeText={(v) => set('deliveryTime', v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 30"
            placeholderTextColor="#aaa"
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <FieldLabel text="Min order (TSh)" />
              <TextInput
                value={form.minOrder}
                onChangeText={(v) => set('minOrder', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 5000"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel text="Delivery fee (TSh)" />
              <TextInput
                value={form.deliveryFee}
                onChangeText={(v) => set('deliveryFee', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 2000"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          accessibilityLabel="Save profile"
          activeOpacity={0.88}
          style={{ borderRadius: RADIUS.pill, overflow: 'hidden' }}
        >
          <LinearGradient colors={[COLORS.orange, COLORS.red]} style={styles.saveBtn}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Save changes</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function FieldLabel({ text }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  header: {
    paddingTop:        Platform.OS === 'ios' ? 54 : 40,
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

  sectionLabel: {
    fontSize:       FONT_SIZE.xs,
    fontWeight:     FONT_WEIGHT.bold,
    color:          COLORS.orange,
    letterSpacing:  0.8,
    marginTop:      SPACING.xl,
    marginBottom:   SPACING.sm,
  },
  fieldLabel: {
    color:        COLORS.dark,
    fontSize:     FONT_SIZE.sm,
    fontWeight:   FONT_WEIGHT.semibold,
    marginBottom: 6,
    marginTop:    SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         14,
    fontSize:        FONT_SIZE.base,
    color:           COLORS.dark,
    ...SHADOW.sm,
  },

  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pickerChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xs + 2,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       COLORS.border,
    backgroundColor:   COLORS.cardBg,
  },
  pickerChipActive:     { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  pickerChipText:       { color: COLORS.textBody, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  pickerChipTextActive: { color: '#fff', fontWeight: FONT_WEIGHT.bold },

  footer: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    padding:           SPACING.lg,
    paddingBottom:     Platform.OS === 'ios' ? 36 : SPACING.lg,
    backgroundColor:   COLORS.cardBg,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
  },
  saveBtn:     { paddingVertical: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  saveBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
});
