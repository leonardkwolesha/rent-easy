import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator,
         KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { isValidEmail } from '../../../shared/formatters';
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
    if (!isValidEmail(email)) { setError('Enter a valid email.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    Alert.alert('Google sign-in', 'Coming soon.');
  }

  function handleForgot() {
    Alert.alert('Reset password', 'We\'ll email you a link to reset your password.');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
          <Ionicons name="restaurant-outline" size={56} color="#fff" />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to order delicious food</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
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

          <TouchableOpacity onPress={handleForgot} style={styles.forgotRow} accessibilityLabel="Forgot password">
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Sign in"
            style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 8 }}
          >
            <LinearGradient colors={BRAND.gradientPrimary} style={styles.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            onPress={handleGoogle}
            accessibilityLabel="Continue with Google"
            style={styles.googleBtn}
          >
            <Ionicons name="logo-google" size={20} color="#dc2626" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>New here? </Text>
            <Text style={[styles.linkText, { color: BRAND.orange, fontWeight: '700' }]}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:        { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  title:         { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 12 },
  subtitle:      { color: '#fff', opacity: 0.9, marginTop: 4 },
  body:          { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  label:         { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input:         { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder,
                   borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark, marginBottom: 12 },
  passwordRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                   borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder, borderWidth: 1,
                   marginBottom: 4, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:        { paddingHorizontal: 14, paddingVertical: 14 },
  forgotRow:     { alignSelf: 'flex-end', marginBottom: 8, marginTop: 4 },
  forgotText:    { color: BRAND.orange, fontWeight: '600', fontSize: 13 },
  error:         { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:           { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow:    { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  divider:       { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  dividerText:   { marginHorizontal: 12, color: '#888', fontSize: 13 },
  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   backgroundColor: '#fff', borderColor: BRAND.cardBorder, borderWidth: 1,
                   borderRadius: BRAND.pillRadius, paddingVertical: 14, gap: 10 },
  googleText:    { color: BRAND.dark, fontSize: 15, fontWeight: '600' },
  linkRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText:      { color: '#666' },
});
