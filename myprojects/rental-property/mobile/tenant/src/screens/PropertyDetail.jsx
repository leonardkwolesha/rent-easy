import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

const FIELD_LABEL = { fontSize: 11, fontWeight: '600', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 };
const INPUT = { backgroundColor: BRAND.bg, borderRadius: 8, borderWidth: 1, borderColor: BRAND.border, padding: 11, fontSize: 14, color: BRAND.text };

const EMP_OPTIONS = [
  { label: 'Employed', value: 'employed' },
  { label: 'Self-employed', value: 'self-employed' },
  { label: 'Student', value: 'student' },
  { label: 'Other', value: 'other' },
];

export default function PropertyDetail({ route, navigation }) {
  const { id } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [applied, setApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ message: '', moveInDate: '', employmentStatus: 'employed', monthlyIncome: '' });

  useEffect(() => {
    Promise.all([
      api.get(`/properties/${id}`),
      api.get('/applications/sent'),
    ]).then(([r, a]) => {
      setProperty(r.data.data);
      const existing = a.data.data?.find(ap => ap.property?._id === id || ap.property === id);
      if (existing) setApplied(true);
    }).catch(() => navigation.goBack()).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!form.moveInDate) return Alert.alert('Required', 'Please enter your desired move-in date.');
    setApplying(true);
    try {
      await api.post(`/applications/property/${id}`, {
        ...form,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
      });
      setApplied(true);
      setShowForm(false);
      Alert.alert('Success', 'Application submitted! The landlord will review it shortly.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application.');
    }
    setApplying(false);
  };

  if (loading) return <ActivityIndicator color={BRAND.primary} style={{ flex: 1, marginTop: 60 }} />;
  if (!property) return null;

  const sc = STATUS_COLORS[property.status] || { bg: BRAND.border, text: BRAND.muted };
  const addr = [property.address?.street, property.address?.area, property.address?.city].filter(Boolean).join(', ');
  const isAvailable = property.status === 'available';
  const imgs = property.images || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BRAND.bg }} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Image gallery */}
      {imgs.length > 0 ? (
        <View>
          <Image source={{ uri: imgs[imgIdx] }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
          {imgs.length > 1 && (
            <>
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{imgIdx + 1} / {imgs.length}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ position: 'absolute', bottom: 8, left: 0, right: 0 }}
                contentContainerStyle={{ paddingHorizontal: 8, gap: 6 }}>
                {imgs.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setImgIdx(i)}
                    style={{ width: 64, height: 46, borderRadius: 7, overflow: 'hidden', borderWidth: 2, borderColor: i === imgIdx ? BRAND.secondary : 'transparent' }}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      ) : (
        <View style={{ height: 200, backgroundColor: BRAND.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="business-outline" size={44} color={BRAND.muted} />
        </View>
      )}

      <View style={{ padding: 18 }}>

        {/* Status + type row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: sc.bg }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>{property.status}</Text>
          </View>
          <Text style={{ fontSize: 12, color: BRAND.muted, textTransform: 'capitalize' }}>{property.type}</Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: BRAND.text, marginBottom: 6, lineHeight: 28 }}>{property.title}</Text>

        {addr ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <Ionicons name="location-outline" size={13} color={BRAND.muted} />
            <Text style={{ fontSize: 13, color: BRAND.muted, flex: 1 }}>{addr}</Text>
          </View>
        ) : null}

        {/* Specs */}
        <View style={{ flexDirection: 'row', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="bed-outline" size={16} color={BRAND.muted} />
            <Text style={{ fontSize: 14, color: BRAND.text }}>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="water-outline" size={16} color={BRAND.muted} />
            <Text style={{ fontSize: 14, color: BRAND.text }}>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</Text>
          </View>
          {property.area_sqm ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="resize-outline" size={16} color={BRAND.muted} />
              <Text style={{ fontSize: 14, color: BRAND.muted }}>{property.area_sqm} m²</Text>
            </View>
          ) : null}
        </View>

        {/* Price card */}
        <View style={{ backgroundColor: BRAND.surface, borderRadius: 12, padding: 16, marginBottom: 14, ...BRAND.shadow }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: BRAND.primary, marginBottom: 2 }}>
            {property.rent?.currency || 'TZS'} {Number(property.rent?.amount || 0).toLocaleString()}
            <Text style={{ fontSize: 13, fontWeight: '400', color: BRAND.muted }}>/{property.rent?.period === 'yearly' ? 'yr' : 'mo'}</Text>
          </Text>
          {property.deposit > 0 && (
            <Text style={{ fontSize: 13, color: BRAND.muted }}>Security deposit: {fmtCurrency(property.deposit)}</Text>
          )}
        </View>

        {/* Landlord contact card */}
        {property.landlord && (
          <View style={{ backgroundColor: BRAND.surface, borderRadius: 12, padding: 16, marginBottom: 14, ...BRAND.shadow }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Listed by</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.primary }}>{property.landlord.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: BRAND.text }}>{property.landlord.name}</Text>
            </View>
            {property.landlord.phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                <Ionicons name="call-outline" size={14} color={BRAND.muted} />
                <Text style={{ fontSize: 13, color: BRAND.muted }}>{property.landlord.phone}</Text>
              </View>
            ) : null}
            {property.landlord.email ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                <Ionicons name="mail-outline" size={14} color={BRAND.muted} />
                <Text style={{ fontSize: 13, color: BRAND.muted }}>{property.landlord.email}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Description */}
        {property.description ? (
          <>
            <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.text, marginBottom: 8 }}>About this property</Text>
            <Text style={{ fontSize: 14, color: BRAND.muted, lineHeight: 21, marginBottom: 20 }}>{property.description}</Text>
          </>
        ) : null}

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <>
            <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.text, marginBottom: 10 }}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {property.amenities.map(a => (
                <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: BRAND.primary + '10' }}>
                  <Ionicons name="checkmark-circle" size={12} color={BRAND.primary} />
                  <Text style={{ fontSize: 12, color: BRAND.primary, fontWeight: '500' }}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Not available notice */}
        {!isAvailable && (
          <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>
              {property.status === 'occupied' ? 'This property is currently occupied' : 'Not available for rent'}
            </Text>
          </View>
        )}

        {/* Apply CTA — already applied state */}
        {isAvailable && applied && (
          <View style={{ backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color={BRAND.success} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46' }}>Application submitted</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#059669' }}>Waiting for the landlord to review your application.</Text>
          </View>
        )}

        {/* Apply Now button */}
        {isAvailable && !applied && (
          <TouchableOpacity
            onPress={() => setShowForm(v => !v)}
            style={{ backgroundColor: showForm ? BRAND.bg : BRAND.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 16, borderWidth: showForm ? 1 : 0, borderColor: BRAND.border }}>
            <Text style={{ color: showForm ? BRAND.text : '#fff', fontWeight: '700', fontSize: 15 }}>
              {showForm ? 'Cancel' : 'Apply Now →'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Application form */}
        {showForm && isAvailable && !applied && (
          <View style={{ backgroundColor: BRAND.surface, borderRadius: 14, padding: 18, ...BRAND.shadow }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.text, marginBottom: 4 }}>Rental Application</Text>
            <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 18 }}>Fill in your details. The landlord will review and respond.</Text>

            <Text style={FIELD_LABEL}>Message to Landlord</Text>
            <TextInput
              value={form.message}
              onChangeText={v => setForm(f => ({ ...f, message: v }))}
              placeholder="Introduce yourself, explain why you're a great tenant..."
              multiline
              numberOfLines={4}
              style={[INPUT, { height: 90, textAlignVertical: 'top' }]}
            />

            <Text style={[FIELD_LABEL, { marginTop: 14 }]}>Desired Move-in Date *</Text>
            <TextInput
              value={form.moveInDate}
              onChangeText={v => setForm(f => ({ ...f, moveInDate: v }))}
              placeholder="YYYY-MM-DD"
              style={INPUT}
            />

            <Text style={[FIELD_LABEL, { marginTop: 14 }]}>Employment Status</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {EMP_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} onPress={() => setForm(f => ({ ...f, employmentStatus: opt.value }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: form.employmentStatus === opt.value ? BRAND.primary : BRAND.border, backgroundColor: form.employmentStatus === opt.value ? BRAND.primary + '12' : BRAND.bg }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: form.employmentStatus === opt.value ? BRAND.primary : BRAND.muted }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[FIELD_LABEL, { marginTop: 14 }]}>Monthly Income (TZS) — optional</Text>
            <TextInput
              value={form.monthlyIncome}
              onChangeText={v => setForm(f => ({ ...f, monthlyIncome: v }))}
              placeholder="e.g. 1500000"
              keyboardType="numeric"
              style={INPUT}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={handleApply} disabled={applying}
                style={{ flex: 1, backgroundColor: applying ? BRAND.muted : BRAND.primary, borderRadius: 10, padding: 14, alignItems: 'center' }}>
                {applying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Submit Application</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowForm(false)}
                style={{ flex: 1, borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg }}>
                <Text style={{ color: BRAND.muted, fontWeight: '500', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
