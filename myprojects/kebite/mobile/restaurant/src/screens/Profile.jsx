import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';
import { useAuth } from '../context/AuthContext';
import { disconnectSocket } from '../../../shared/socket';

export default function Profile() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive',
        onPress: async () => { disconnectSocket(); await logout(); } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.pageBg }}>
      <LinearGradient colors={BRAND.gradientPrimary} style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="restaurant-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.restaurantName || user?.name || 'Restaurant'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        <Row icon="restaurant-outline" label="Restaurant" value={user?.restaurantName || user?.name || '—'} />
        <Row icon="mail-outline"       label="Email"      value={user?.email || '—'} />
        <Row icon="location-outline"   label="City"       value="Dar es Salaam" />

        <TouchableOpacity onPress={confirmLogout} accessibilityLabel="Sign out" style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={BRAND.red} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={BRAND.orange} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header:     { paddingTop: 60, paddingBottom: 28, alignItems: 'center' },
  avatar:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name:       { color: '#fff', fontSize: 22, fontWeight: '700' },
  email:      { color: '#fff', opacity: 0.9, marginTop: 2 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.cardBg,
                borderRadius: BRAND.cardRadius, padding: 14, marginBottom: 8,
                borderColor: BRAND.cardBorder, borderWidth: 1 },
  rowLabel:   { color: '#666', marginLeft: 12, flex: 1 },
  rowValue:   { color: BRAND.dark, fontWeight: '600' },
  logout:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                marginTop: 24, padding: 16, gap: 8 },
  logoutText: { color: BRAND.red, fontWeight: '700', fontSize: 16 },
});
