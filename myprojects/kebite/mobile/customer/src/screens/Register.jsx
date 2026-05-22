import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
         KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from 'shared/theme';
import { isValidTzPhone, isValidEmail, formatPhone } from 'shared/formatters';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

const ROLES = [
  { id: 'customer',   label: 'Customer',   icon: 'person-outline',     desc: 'Order food from local restaurants' },
  { id: 'rider',      label: 'Rider',      icon: 'bicycle-outline',    desc: 'Deliver orders and earn money' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', desc: 'Sell food to customers' },
];

export default function Register({ navigation }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);

  const [role, setRole]         = useState('customer');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  function nextStep() {
    setError(null);
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!name.trim())             { setError('Please enter your name.'); return; }
      if (!isValidEmail(email))     { setError('Enter a valid email address.'); return; }
      if (!isValidTzPhone(phone))   { setError('Enter a valid Tanzanian phone number.'); return; }
      setStep(3); return;
    }
  }

  async function handleSubmit() {
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        phone:    formatPhone(phone),
        password,
        role,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 1 ? navigation.goBack() : setStep(step - 1))}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>I want to join as a</Text>
              {ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setRole(r.id)}
                    accessibilityLabel={`Select ${r.label}`}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                  >
                    <Ionicons
                      name={r.icon}
                      size={28}
                      color={active ? BRAND.orange : '#666'}
                    />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.roleLabel, active && { color: BRAND.orange }]}>{r.label}</Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={active ? BRAND.orange : '#bbb'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Your details</Text>

              <Text style={styles.label}>Full name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Your name"
                         placeholderTextColor="#aaa" style={styles.input} />

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={styles.label}>Phone number</Text>
              <PhoneInput value={phone} onChangeText={setPhone} />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Set your password</Text>

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={BRAND.dark}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                style={styles.input}
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={step === 3 ? handleSubmit : nextStep}
            disabled={loading}
            accessibilityLabel={step === 3 ? 'Create account' : 'Continue'}
            style={{ borderRadius: BRAND.pillRadius, overflow: 'hidden', marginTop: 16 }}
          >
            <LinearGradient colors={BRAND.gradientPrimary} style={styles.btn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{step === 3 ? 'Create account' : 'Continue'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:        { paddingTop: 70, paddingBottom: 28, alignItems: 'center', paddingHorizontal: 20 },
  backBtn:       { position: 'absolute', top: 56, left: 16 },
  title:         { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle:      { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 13 },
  progressBar:   { width: '100%', height: 5, backgroundColor: 'rgba(255,255,255,0.3)',
                   borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  body:          { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  stepTitle:     { fontSize: 18, fontWeight: '700', color: BRAND.dark, marginBottom: 16 },
  label:         { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input:         { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder,
                   borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark, marginBottom: 12 },
  passwordRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                   borderRadius: BRAND.cardRadius, borderColor: BRAND.cardBorder, borderWidth: 1,
                   marginBottom: 12, overflow: 'hidden' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:        { paddingHorizontal: 14, paddingVertical: 14 },
  roleCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                   borderColor: BRAND.cardBorder, borderWidth: 1, borderRadius: BRAND.cardRadius,
                   padding: 14, marginBottom: 10 },
  roleCardActive:{ borderColor: BRAND.orange, borderWidth: 2 },
  roleLabel:     { fontSize: 16, fontWeight: '700', color: BRAND.dark },
  roleDesc:      { color: '#666', fontSize: 12, marginTop: 2 },
  error:         { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:           { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
});
