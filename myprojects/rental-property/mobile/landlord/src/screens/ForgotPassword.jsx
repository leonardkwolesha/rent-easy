import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND } from '../../../shared/theme';

export default function ForgotPassword({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    setStep(2);
  };

  const handleReset = async () => {
    if (!newPassword) return Alert.alert('Error', 'Please enter a new password');
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (newPassword !== confirm) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email: email.trim().toLowerCase(), newPassword });
      Alert.alert('Success', data.message, [{ text: 'Sign In', onPress: () => navigation.replace('Login') }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Reset failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.bg }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={BRAND.text} />
        </TouchableOpacity>

        <Ionicons name="lock-open-outline" size={40} color={BRAND.secondary} style={styles.icon} />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.sub}>
          {step === 1 ? 'Enter your registered email address' : 'Create a new password for your account'}
        </Text>

        {step === 1 ? (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity onPress={handleNext} style={styles.btn}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.emailNote}>{email}</Text>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passWrap}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 6 characters"
                secureTextEntry={!showNew}
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowNew(s => !s)} style={{ padding: 10 }}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={18} color={BRAND.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passWrap}>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                secureTextEntry={!showConfirm}
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowConfirm(s => !s)} style={{ padding: 10 }}>
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={18} color={BRAND.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleReset} disabled={loading}
              style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}>
              <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: BRAND.surface, borderRadius: 16, padding: 24, ...BRAND.shadow },
  back: { marginBottom: 8 },
  icon: { alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: BRAND.text, textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: BRAND.muted, textAlign: 'center', marginBottom: 20 },
  emailNote: { fontSize: 13, fontWeight: '600', color: BRAND.primary, textAlign: 'center', marginBottom: 16,
    backgroundColor: BRAND.bg, borderRadius: 8, padding: 10 },
  label: { fontSize: 13, fontWeight: '500', color: BRAND.muted, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, padding: 12, fontSize: 14, color: BRAND.text },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border },
  btn: { backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
