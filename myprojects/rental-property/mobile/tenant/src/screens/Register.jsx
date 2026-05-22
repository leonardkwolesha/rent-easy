import { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { setToken, setUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { AuthContext } from '../navigation/AppNavigator';

export default function Register({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password)
      return Alert.alert('Error', 'Please fill in all required fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, role: 'tenant' });
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
        {...opts}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.sub}>Tenant registration</Text>

      <View style={{ gap: 12, marginBottom: 20 }}>
        {field('Full Name', 'name', { placeholder: 'John Doe' })}
        {field('Email', 'email', { placeholder: 'you@email.com', keyboardType: 'email-address', autoCapitalize: 'none' })}
        {field('Phone (optional)', 'phone', { placeholder: '+255 7xx xxx xxx', keyboardType: 'phone-pad' })}

        {/* Password with eye icon */}
        <View>
          <Text style={styles.label}>Password</Text>
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
        <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
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
  title: { fontSize: 24, fontWeight: '700', color: BRAND.text, marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 13, color: BRAND.muted, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: BRAND.muted, marginBottom: 4 },
  input: { backgroundColor: BRAND.surface, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, padding: 12, fontSize: 14, color: BRAND.text },
  btn: { backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.surface, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border },
  passInput: { flex: 1, padding: 12, fontSize: 14, color: BRAND.text },
  eyeBtn: { padding: 12 },
});
