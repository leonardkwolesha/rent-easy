import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={[BRAND.primary, BRAND.primaryMid]} style={styles.container}>
      <Ionicons name="business" size={60} color="#fff" />
      <Text style={styles.title}>RentEase</Text>
      <Text style={styles.sub}>LANDLORD APP</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 14 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, letterSpacing: 2 },
});
