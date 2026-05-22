import { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { setToken, setUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { AuthContext } from '../navigation/AppNavigator';

export default function Register({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', agencyName: '' });
  const [role, setRole] = useState('landlord');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password)
      return Alert.alert('Error', 'Please fill in all required fields');
    if (form.password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      const payload = { ...form, role };
      if (role !== 'agent') delete payload.agencyName;
      const { data } = await api.post('/auth/register', payload);
      await setToken(data.token);
      await setUser(data.user);
      signIn();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const field = (label, key, opts = {}) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
        style={styles.input}
        placeholderTextColor={BRAND.muted}
        {...opts}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoWrap}>
        <Ionicons name="business" size={32} color="#fff" />
      </View>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.sub}>Join RentEase as a property manager</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          onPress={() => setRole('landlord')}
          style={[styles.roleBtn, role === 'landlord' && styles.roleBtnActive]}
        >
          <Ionicons name="home-outline" size={16} color={role === 'landlord' ? '#fff' : BRAND.muted} />
          <Text style={[styles.roleBtnText, role === 'landlord' && styles.roleBtnTextActive]}>Landlord</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole('agent')}
          style={[styles.roleBtn, role === 'agent' && styles.roleBtnActive]}
        >
          <Ionicons name="briefcase-outline" size={16} color={role === 'agent' ? '#fff' : BRAND.muted} />
          <Text style={[styles.roleBtnText, role === 'agent' && styles.roleBtnTextActive]}>Agent</Text>
        </TouchableOpacity>
      </View>

      {role === 'agent' && (
        <View style={styles.agentNotice}>
          <Ionicons name="information-circle-outline" size={15} color={BRAND.secondary} />
          <Text style={styles.agentNoticeText}>Agent accounts require admin approval before you can access all features.</Text>
        </View>
      )}

      <View style={{ gap: 12, marginBottom: 20 }}>
        {field('Full Name *', 'name', { placeholder: 'John Doe' })}
        {field('Email Address *', 'email', { placeholder: 'you@email.com', keyboardType: 'email-address', autoCapitalize: 'none' })}
        {field('Phone (optional)', 'phone', { placeholder: '+255 7xx xxx xxx', keyboardType: 'phone-pad' })}
        {role === 'agent' && field('Agency Name', 'agencyName', { placeholder: 'Your agency name' })}

        <View>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passWrap}>
            <TextInput
              value={form.password}
              onChangeText={v => setForm(f => ({ ...f, password: v }))}
              placeholder="Min. 6 characters"
              placeholderTextColor={BRAND.muted}
              secureTextEntry={!showPass}
              style={styles.passInput}
            />
            <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={BRAND.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleRegister} disabled={loading} style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.btnText}>Create Account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14, alignSelf: 'center' }}>
        <Text style={{ color: BRAND.muted, fontSize: 13 }}>
          Already have an account?{' '}
          <Text style={{ color: BRAND.primary, fontWeight: '600' }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  logoWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: BRAND.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: BRAND.text, marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 13, color: BRAND.muted, textAlign: 'center', marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.border, backgroundColor: BRAND.surface },
  roleBtnActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: BRAND.muted },
  roleBtnTextActive: { color: '#fff' },
  agentNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BRAND.secondary + '12', borderRadius: 10, padding: 12, marginBottom: 14 },
  agentNoticeText: { fontSize: 12, color: BRAND.muted, flex: 1, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: '500', color: BRAND.muted, marginBottom: 4 },
  input: { backgroundColor: BRAND.surface, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, padding: 12, fontSize: 14, color: BRAND.text },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.surface, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border },
  passInput: { flex: 1, padding: 12, fontSize: 14, color: BRAND.text },
  eyeBtn: { padding: 12 },
  btn: { backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
