import { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUser, removeToken, removeUser, setUser as saveUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { AuthContext } from '../navigation/AppNavigator';
import api from '../../../shared/api';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { signOut } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', agencyName: '' });
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { getUser().then(u => { setUser(u); if (u) setForm({ name: u.name || '', phone: u.phone || '', agencyName: u.agencyName || '' }); }); }, []));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of landlord account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await removeToken(); await removeUser(); signOut();
      }},
    ]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { name: form.name.trim(), phone: form.phone.trim(), agencyName: form.agencyName.trim() });
      const updated = { ...user, ...data.data };
      await saveUser(updated);
      setUser(updated);
      setShowEdit(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const role = user?.role === 'agent' ? 'AGENT' : user?.role === 'admin' ? 'ADMIN' : 'LANDLORD';
  const roleColor = user?.role === 'agent' ? BRAND.accent : BRAND.secondary;

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: BRAND.secondary + '15' }]}>
        <Ionicons name={icon} size={18} color={BRAND.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '30' }]}>
          <Text style={[styles.roleText, { color: '#fff' }]}>{role}</Text>
        </View>
        {user?.role === 'agent' && !user?.isApproved && (
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={12} color="#92400E" />
            <Text style={styles.pendingText}>Pending Admin Approval</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={15} color={BRAND.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow icon="person-outline" label="Full Name" value={user?.name} />
        <InfoRow icon="mail-outline" label="Email Address" value={user?.email} />
        <InfoRow icon="call-outline" label="Phone Number" value={user?.phone} />
        {user?.role === 'agent' && <InfoRow icon="business-outline" label="Agency Name" value={user?.agencyName} />}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrap, { backgroundColor: BRAND.primary + '15' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={BRAND.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{role}</Text>
          </View>
        </View>
        {user?.role === 'agent' && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: (user.isApproved ? BRAND.success : BRAND.warn) + '20' }]}>
              <Ionicons name={user.isApproved ? 'checkmark-circle-outline' : 'time-outline'} size={18} color={user.isApproved ? BRAND.success : BRAND.warn} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Approval Status</Text>
              <Text style={[styles.infoValue, { color: user.isApproved ? BRAND.success : BRAND.warn }]}>
                {user.isApproved ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color={BRAND.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEdit(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={BRAND.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={BRAND.muted} style={{ marginRight: 8 }} />
              <TextInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Your full name" style={styles.fieldInput} />
            </View>

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={BRAND.muted} style={{ marginRight: 8 }} />
              <TextInput value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="+255 7xx xxx xxx" keyboardType="phone-pad" style={styles.fieldInput} />
            </View>

            {user?.role === 'agent' && (
              <>
                <Text style={styles.fieldLabel}>Agency Name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="business-outline" size={18} color={BRAND.muted} style={{ marginRight: 8 }} />
                  <TextInput value={form.agencyName} onChangeText={v => setForm(f => ({ ...f, agencyName: v }))} placeholder="Your agency name" style={styles.fieldInput} />
                </View>
              </>
            )}

            <View style={styles.emailNotice}>
              <Ionicons name="information-circle-outline" size={16} color={BRAND.muted} />
              <Text style={styles.emailNoticeText}>Email address cannot be changed. Contact support if needed.</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  header: { backgroundColor: BRAND.primary, padding: 32, alignItems: 'center', paddingBottom: 36 },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  roleBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pendingText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  section: { backgroundColor: BRAND.surface, margin: 12, marginBottom: 0, borderRadius: 16, padding: 16, ...BRAND.shadow },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND.primary + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: BRAND.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: BRAND.muted, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', color: BRAND.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', margin: 12, borderRadius: 14, padding: 15, justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA', marginTop: 12 },
  logoutText: { fontSize: 15, fontWeight: '700', color: BRAND.danger },
  modalContainer: { flex: 1, backgroundColor: BRAND.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, backgroundColor: BRAND.surface, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  saveBtn: { backgroundColor: BRAND.primary, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 8, marginTop: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.surface, borderRadius: 12, borderWidth: 1.5, borderColor: BRAND.border, paddingHorizontal: 12 },
  fieldInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: BRAND.text },
  emailNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BRAND.bg, borderRadius: 10, padding: 12, marginTop: 24, borderWidth: 1, borderColor: BRAND.border },
  emailNoticeText: { fontSize: 12, color: BRAND.muted, flex: 1, lineHeight: 17 },
});
