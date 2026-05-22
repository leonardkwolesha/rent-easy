import { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { setToken, setUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { AuthContext } from '../navigation/AppNavigator';

export default function Login({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'tenant') return Alert.alert('Error', 'This app is for tenants only');
      await setToken(data.token);
      await setUser(data.user);
      signIn();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="business" size={40} color={BRAND.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to your tenant account</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))}
          placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none"
          style={styles.input} />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passWrap}>
          <TextInput value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))}
            placeholder="••••••••" secureTextEntry={!show} style={[styles.input, { flex: 1, borderWidth: 0 }]} />
          <TouchableOpacity onPress={() => setShow(s => !s)} style={{ padding: 10 }}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={18} color={BRAND.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
          <Text style={{ color: BRAND.secondary, fontSize: 12, fontWeight: '500' }}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} disabled={loading}
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}>
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignSelf: 'center' }}>
          <Text style={{ color: BRAND.muted, fontSize: 13 }}>No account? <Text style={{ color: BRAND.primary, fontWeight: '600' }}>Register</Text></Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: BRAND.surface, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 22, fontWeight: '700', color: BRAND.text, textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: BRAND.muted, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: BRAND.muted, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, padding: 12, fontSize: 14, color: BRAND.text },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border },
  btn: { backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
