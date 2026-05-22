import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator,
         KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, COLORS } from 'shared/theme';

const NAVY  = '#1a1a2e';
const NAVY2 = '#16213e';
import { useAuth } from '../context/AuthContext';

export default function Login({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  async function handleSubmit() {
    setError(null);
    if (!email.includes('@'))  { setError('Enter a valid email.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const status = err?.response?.status;
      if (!err?.response)      setError('Cannot connect to server. Check your internet connection.');
      else if (status === 401) setError('Incorrect email or password.');
      else if (status === 403) setError(err.response.data?.message || 'Account pending approval.');
      else setError(err.response.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[NAVY, NAVY2]} style={styles.header}>
          <Ionicons name="restaurant-outline" size={56} color={COLORS.orange} />
          <Text style={styles.title}>Restaurant Partner</Text>
          <Text style={styles.subtitle}>Manage your orders and menu</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@restaurant.tz"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={styles.eyeBtn}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={BRAND.dark} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Sign in"
            style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 12 }}
          >
            <LinearGradient colors={[COLORS.orange, COLORS.red]} style={styles.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.partnerCard}>
            <Ionicons name="storefront-outline" size={28} color={BRAND.orange} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.partnerTitle}>Grow your restaurant</Text>
              <Text style={styles.partnerDesc}>Reach thousands of hungry customers in Dar es Salaam.</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow} accessibilityLabel="Partner with us">
            <Text style={styles.linkText}>New to Kebite? </Text>
            <Text style={[styles.linkText, { color: BRAND.orange, fontWeight: '700' }]}>Partner with us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:        { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  title:         { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 12 },
  subtitle:      { color: '#fff', opacity: 0.9, marginTop: 4 },
  body:          { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  label:         { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input:         { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder,
                   borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark, marginBottom: 12 },
  passwordRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                   borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder, borderWidth: 1,
                   marginBottom: 12, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:        { paddingHorizontal: 14, paddingVertical: 14 },
  forgotRow:     { alignSelf: 'flex-end', marginTop: 4, marginBottom: 4 },
  forgotText:    { color: BRAND.orange, fontWeight: '600', fontSize: 13 },
  error:         { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:           { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  partnerCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f0',
                   borderRadius: BRAND.cardRadius, borderColor: BRAND.orange, borderWidth: 1,
                   padding: 14, marginTop: 24 },
  partnerTitle:  { color: BRAND.dark, fontWeight: '700', fontSize: 14 },
  partnerDesc:   { color: '#666', fontSize: 12, marginTop: 2 },
  linkRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkText:      { color: '#666' },
});
