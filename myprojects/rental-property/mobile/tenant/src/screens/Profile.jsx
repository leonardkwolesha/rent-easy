import { useState, useCallback, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
         Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUser, removeToken, removeUser, setUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { fmtDate } from '../../../shared/formatters';
import api from '../../../shared/api';
import { AuthContext } from '../navigation/AppNavigator';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { signOut } = useContext(AuthContext);
  const [user, setUserState]    = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    const u = await getUser();
    setUserState(u);
    // Refresh from server to get latest data
    try {
      const r = await api.get('/users/profile');
      const fresh = r.data.data;
      await setUser(fresh);
      setUserState(fresh);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Name cannot be empty.');
    setSaving(true);
    try {
      const r = await api.put('/users/profile', { name: form.name.trim(), phone: form.phone.trim() });
      const updated = r.data.data;
      await setUser(updated);
      setUserState(updated);
      setShowEdit(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await removeToken();
        await removeUser();
        signOut();
      }},
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: BRAND.primary, paddingTop: insets.top + 28, paddingBottom: 36, alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#fff' }}>{initial}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 3 }}>{user?.name || '—'}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{user?.email}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>TENANT</Text>
        </View>
      </View>

      {/* Edit profile button */}
      <TouchableOpacity onPress={openEdit} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: BRAND.secondary, borderRadius: 12, marginHorizontal: 16,
        marginTop: -20, padding: 13, ...BRAND.shadow,
      }}>
        <Ionicons name="create-outline" size={17} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Info section */}
      <View style={{ backgroundColor: BRAND.surface, borderRadius: 14, margin: 16, marginTop: 16, ...BRAND.shadow, overflow: 'hidden' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND.muted, padding: 14, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Personal Information
        </Text>
        {[
          { icon: 'person-outline',   label: 'Full Name',     value: user?.name    || '—' },
          { icon: 'mail-outline',     label: 'Email Address', value: user?.email   || '—' },
          { icon: 'call-outline',     label: 'Phone',         value: user?.phone   || 'Not set' },
          { icon: 'shield-checkmark-outline', label: 'Role',  value: 'Tenant' },
          { icon: 'calendar-outline', label: 'Member Since',  value: fmtDate(user?.createdAt) },
        ].map(({ icon, label, value }, i, arr) => (
          <View key={label} style={{
            flexDirection: 'row', alignItems: 'center', padding: 14,
            borderTopWidth: i === 0 ? 1 : 0, borderTopColor: BRAND.border,
            borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: BRAND.border,
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name={icon} size={17} color={BRAND.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: BRAND.muted, marginBottom: 1 }}>{label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: BRAND.text }}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Account section */}
      <View style={{ backgroundColor: BRAND.surface, borderRadius: 14, marginHorizontal: 16, marginBottom: 16, ...BRAND.shadow, overflow: 'hidden' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND.muted, padding: 14, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Account
        </Text>
        <TouchableOpacity onPress={handleLogout} style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
          borderTopWidth: 1, borderTopColor: BRAND.border,
        }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="log-out-outline" size={17} color={BRAND.danger} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: BRAND.danger }}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color={BRAND.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.text }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={22} color={BRAND.muted} />
              </TouchableOpacity>
            </View>

            <Text style={FL}>Full Name *</Text>
            <TextInput
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Your full name"
              style={INPUT}
            />

            <Text style={[FL, { marginTop: 14 }]}>Phone Number</Text>
            <TextInput
              value={form.phone}
              onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="e.g. 0712345678"
              keyboardType="phone-pad"
              style={INPUT}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowEdit(false)} style={{
                flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
                borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg,
              }}>
                <Text style={{ color: BRAND.muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{
                flex: 2, backgroundColor: BRAND.primary, borderRadius: 12, padding: 14,
                alignItems: 'center', opacity: saving ? 0.7 : 1,
              }}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const FL    = { fontSize: 11, fontWeight: '600', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 };
const INPUT = { backgroundColor: BRAND.bg, borderRadius: 9, borderWidth: 1, borderColor: BRAND.border, padding: 12, fontSize: 14, color: BRAND.text };
