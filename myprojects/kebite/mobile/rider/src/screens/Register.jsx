import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
         KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from 'shared/theme';
import { isValidEmail, isValidTzPhone, formatPhone } from 'shared/formatters';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

const VEHICLES = [
  { id: 'motorcycle', label: 'Motorcycle', icon: 'speedometer-outline' },
  { id: 'car',        label: 'Car',        icon: 'car-outline' },
];

export default function Register({ navigation }) {
  const { register } = useAuth();
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [vehicleType, setVehicleType]   = useState('motorcycle');
  const [licenseNumber, setLicense]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim())            { setError('Please enter your name.'); return; }
    if (!isValidEmail(email))    { setError('Enter a valid email address.'); return; }
    if (!isValidTzPhone(phone))  { setError('Enter a valid Tanzanian phone number.'); return; }
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await register({
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        phone:         formatPhone(phone),
        password,
        vehicleType,
        licenseNumber: licenseNumber.trim() || undefined,
      });
      Alert.alert(
        'Account created',
        'Your rider account is pending approval. The Kebite team will review within 24 hours.'
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Become a rider</Text>
          <Text style={styles.subtitle}>Earn delivering across Dar es Salaam</Text>
        </LinearGradient>

        <View style={styles.body}>
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

          <Text style={styles.label}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            {VEHICLES.map((v) => {
              const active = vehicleType === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setVehicleType(v.id)}
                  accessibilityLabel={`Vehicle ${v.label}`}
                  style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                >
                  <Ionicons name={v.icon} size={20} color={active ? '#fff' : BRAND.dark} />
                  <Text style={[styles.vehicleText, active && { color: '#fff' }]}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>License number (optional)</Text>
          <TextInput value={licenseNumber} onChangeText={setLicense} placeholder="e.g. T123ABC"
                     placeholderTextColor="#aaa" autoCapitalize="characters" style={styles.input} />

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
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={BRAND.dark} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="Create rider account"
            style={{ borderRadius: BRAND.cardRadius, overflow: 'hidden', marginTop: 12 }}
          >
            <LinearGradient colors={BRAND.gradientPrimary} style={styles.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:           { paddingTop: 70, paddingBottom: 36, alignItems: 'center' },
  backBtn:          { position: 'absolute', top: 56, left: 16 },
  title:            { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle:         { color: '#fff', opacity: 0.9, marginTop: 4 },
  body:             { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  label:            { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input:            { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: '#eee',
                      borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark, marginBottom: 12 },
  vehicleRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  vehicleChip:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: '#eee',
                      borderWidth: 1, padding: 12, gap: 6 },
  vehicleChipActive:{ backgroundColor: BRAND.orange, borderColor: BRAND.orange },
  vehicleText:      { color: BRAND.dark, fontWeight: '600' },
  passwordRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                      borderRadius: BRAND.cardRadius, borderColor: '#eee', borderWidth: 1,
                      marginBottom: 12, overflow: 'hidden' },
  passwordInput:    { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:           { paddingHorizontal: 14, paddingVertical: 14 },
  error:            { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:              { padding: 16, alignItems: 'center' },
  btnText:          { color: '#fff', fontSize: 16, fontWeight: '700' },
});
