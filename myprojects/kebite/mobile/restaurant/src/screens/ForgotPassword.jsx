import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from 'shared/theme';
import { isValidEmail } from 'shared/formatters';
import api from 'shared/api';

export default function ForgotPassword({ navigation }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      const status = err?.response?.status;
      if (!err?.response)   setError('Cannot connect to server. Check your internet connection.');
      else if (status === 404) setError('No account found with that email address.');
      else setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.sentScreen}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={48} color={BRAND.orange} />
        </View>
        <Text style={styles.sentTitle}>Check your inbox</Text>
        <Text style={styles.sentDesc}>
          We sent a password reset link to{'\n'}
          <Text style={{ fontWeight: '700', color: BRAND.dark }}>{email}</Text>
        </Text>
        <Text style={styles.sentHint}>Didn't receive it? Check your spam folder.</Text>
        <TouchableOpacity onPress={() => { setSent(false); setEmail(''); }} style={styles.resendBtn}>
          <Text style={styles.resendText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={BRAND.orange} />
          <Text style={styles.backLinkText}>Back to Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.headerArea}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIconBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={40} color={BRAND.orange} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={(v) => { setEmail(v); setError(null); }}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
          />

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={BRAND.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Send reset link"
            style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 16 }}
          >
            <LinearGradient colors={BRAND.gradientPrimary} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send reset link</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backLink}
          >
            <Ionicons name="arrow-back" size={16} color={BRAND.orange} />
            <Text style={styles.backLinkText}>Back to Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sentScreen: {
    flex: 1,
    backgroundColor: BRAND.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sentTitle: { color: BRAND.dark, fontSize: 26, fontWeight: '700', marginBottom: 12, marginTop: 16, textAlign: 'center' },
  sentDesc:  { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  sentHint:  { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  resendBtn: {
    marginTop: 28, paddingVertical: 12, paddingHorizontal: 32,
    backgroundColor: '#fff5f0', borderRadius: 99, borderWidth: 1, borderColor: '#ffe5d0',
  },
  resendText: { color: BRAND.orange, fontWeight: '700', fontSize: 15 },

  headerArea: {
    paddingTop: 64,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: BRAND.pageBg,
  },
  backIconBtn: { position: 'absolute', top: 58, left: 16, padding: 8 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff5f0',
    borderWidth: 2,
    borderColor: '#ffe5d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title:    { color: BRAND.dark, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  body:     { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  label:    { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: BRAND.cardRadius,
    borderColor: BRAND.cardBorder,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    color: BRAND.dark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff5f5',
    borderRadius: BRAND.cardRadius,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    marginTop: 10,
  },
  errorText:    { color: BRAND.red, fontSize: 13, flex: 1 },
  btn:          { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  backLinkText: { color: BRAND.orange, fontWeight: '600', fontSize: 14 },
});
