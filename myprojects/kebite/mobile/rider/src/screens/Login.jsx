import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator,
         KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { isValidEmail } from '../../../shared/formatters';
import { useAuth } from '../context/AuthContext';

const REQUIREMENTS = [
  'Be 18 years or older',
  'Own a motorbike',
  'Have a valid riding licence',
  'Smartphone with mobile data',
];

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
      setError(err?.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
          <Ionicons name="bicycle-outline" size={56} color="#fff" />
          <Text style={styles.title}>Kebite Rider</Text>
          <Text style={styles.subtitle}>Sign in to start earning</Text>
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

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Sign in"
            style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 12 }}
          >
            <LinearGradient colors={BRAND.gradientPrimary} style={styles.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.reqCard}>
            <Text style={styles.reqTitle}>Requirements to join</Text>
            {REQUIREMENTS.map((r) => (
              <View key={r} style={styles.reqRow}>
                <Ionicons name="checkmark-circle" size={18} color={BRAND.orange} />
                <Text style={styles.reqText}>{r}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow} accessibilityLabel="Apply to join">
            <Text style={styles.linkText}>Want to ride with us? </Text>
            <Text style={[styles.linkText, { color: BRAND.orange, fontWeight: '700' }]}>Apply to join</Text>
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
                   marginBottom: 12, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:        { paddingHorizontal: 14, paddingVertical: 14 },
  error:         { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:           { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  reqCard:       { backgroundColor: BRAND.cardBg, borderRadius: BRAND.cardRadius,
                   borderColor: BRAND.cardBorder, borderWidth: 1, padding: 14, marginTop: 24 },
  reqTitle:      { color: BRAND.dark, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  reqRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 },
  reqText:       { color: '#444', fontSize: 13 },
  linkRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText:      { color: '#666' },
});
