import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
         KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { isValidEmail, isValidTzPhone, formatPhone } from '../../../shared/formatters';
import { useAuth } from '../context/AuthContext';

export default function Register({ navigation }) {
  const { register } = useAuth();
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [phone, setPhone]                     = useState('');
  const [restaurantName, setRestaurantName]   = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [password, setPassword]               = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);

  function handlePhoneChange(text) {
    const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
    setPhone(digits);
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim())                  { setError('Please enter the owner name.'); return; }
    if (!isValidEmail(email))          { setError('Enter a valid email address.'); return; }
    if (!isValidTzPhone(phone))        { setError('Enter a valid Tanzanian phone number.'); return; }
    if (!restaurantName.trim())        { setError('Please enter the restaurant name.'); return; }
    if (!restaurantAddress.trim())     { setError('Please enter the street address.'); return; }
    if (password.length < 6)           { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await register({
        name:              name.trim(),
        email:             email.trim().toLowerCase(),
        phone:             formatPhone(phone),
        password,
        restaurantName:    restaurantName.trim(),
        restaurantAddress: restaurantAddress.trim(),
      });
      Alert.alert(
        'Account created',
        'Your restaurant is pending approval. The Kebite team will review within 24 hours.'
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
          <Text style={styles.title}>List your restaurant</Text>
          <Text style={styles.subtitle}>Reach customers across Dar es Salaam</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.section}>About you</Text>

          <Text style={styles.label}>Owner full name</Text>
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
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>+255</Text></View>
            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="712 345 678"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={9}
              style={styles.phoneInput}
            />
          </View>

          <Text style={styles.section}>About the restaurant</Text>

          <Text style={styles.label}>Restaurant name</Text>
          <TextInput value={restaurantName} onChangeText={setRestaurantName} placeholder="e.g. Mama Lishe Kitchen"
                     placeholderTextColor="#aaa" style={styles.input} />

          <Text style={styles.label}>Street address</Text>
          <TextInput
            value={restaurantAddress}
            onChangeText={setRestaurantAddress}
            placeholder="House no., street, area"
            placeholderTextColor="#aaa"
            multiline
            style={[styles.input, { minHeight: 60 }]}
          />

          <Text style={styles.section}>Security</Text>

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
            accessibilityLabel="Create restaurant account"
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
  header:          { paddingTop: 70, paddingBottom: 36, alignItems: 'center' },
  backBtn:         { position: 'absolute', top: 56, left: 16 },
  title:           { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle:        { color: '#fff', opacity: 0.9, marginTop: 4 },
  body:            { flex: 1, padding: 24, backgroundColor: BRAND.pageBg },
  section:         { fontSize: 14, fontWeight: '700', color: BRAND.orange, marginTop: 8,
                     marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  label:           { color: BRAND.dark, marginBottom: 6, fontWeight: '600' },
  input:           { backgroundColor: '#fff', borderRadius: BRAND.cardRadius, borderColor: '#eee',
                     borderWidth: 1, padding: 14, fontSize: 16, color: BRAND.dark, marginBottom: 12 },
  phoneRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: BRAND.cardRadius, borderColor: '#eee', borderWidth: 1,
                     overflow: 'hidden', marginBottom: 12 },
  phonePrefix:     { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#f8f8f8',
                     borderRightWidth: 1, borderRightColor: '#eee' },
  phonePrefixText: { fontSize: 16, fontWeight: '600', color: BRAND.dark },
  phoneInput:      { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: BRAND.dark },
  passwordRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: BRAND.cardRadius, borderColor: '#eee', borderWidth: 1,
                     marginBottom: 12, overflow: 'hidden' },
  passwordInput:   { flex: 1, padding: 14, fontSize: 16, color: BRAND.dark },
  eyeBtn:          { paddingHorizontal: 14, paddingVertical: 14 },
  error:           { color: BRAND.red, marginVertical: 8, textAlign: 'center' },
  btn:             { padding: 16, alignItems: 'center' },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '700' },
});
