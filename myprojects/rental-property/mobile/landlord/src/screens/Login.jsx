import { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
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
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (!['landlord', 'agent', 'admin'].includes(data.user.role)) {
        return Alert.alert('Access Denied', 'This app is for landlords and agents only.');
      }
      await setToken(data.token);
      await setUser(data.user);
      signIn();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Check your credentials and try again.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.bg }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="business" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>RentEase</Text>
        <Text style={styles.appSub}>Landlord Portal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Sign in to manage your properties</Text>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={BRAND.muted} style={styles.inputIcon} />
          <TextInput
            value={form.email}
            onChangeText={v => setForm(f => ({ ...f, email: v }))}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor={BRAND.muted}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={BRAND.muted} style={styles.inputIcon} />
          <TextInput
            value={form.password}
            onChangeText={v => setForm(f => ({ ...f, password: v }))}
            placeholder="••••••••"
            secureTextEntry={!showPass}
            style={[styles.input, { flex: 1 }]}
            placeholderTextColor={BRAND.muted}
          />
          <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={BRAND.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.btn, loading && styles.btnDisabled]}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerWrap}>
          <Text style={styles.registerText}>
            New to RentEase?{' '}
            <Text style={{ color: BRAND.primary, fontWeight: '600' }}>Create account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: BRAND.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10, ...BRAND.shadow },
  appName: { fontSize: 28, fontWeight: '800', color: BRAND.primary, letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: BRAND.muted, marginTop: 2, letterSpacing: 1 },
  card: { backgroundColor: BRAND.surface, borderRadius: 20, padding: 24, ...BRAND.shadow },
  title: { fontSize: 20, fontWeight: '700', color: BRAND.text, marginBottom: 4 },
  sub: { fontSize: 13, color: BRAND.muted, marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '600', color: BRAND.muted, marginBottom: 6, marginTop: 14, letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.bg, borderRadius: 12, borderWidth: 1.5, borderColor: BRAND.border, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: BRAND.text },
  eyeBtn: { padding: 8 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 4 },
  forgot: { fontSize: 13, color: BRAND.secondary, fontWeight: '600' },
  btn: { backgroundColor: BRAND.primary, borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 18, flexDirection: 'row', justifyContent: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerWrap: { marginTop: 16, alignSelf: 'center' },
  registerText: { fontSize: 13, color: BRAND.muted },
});
