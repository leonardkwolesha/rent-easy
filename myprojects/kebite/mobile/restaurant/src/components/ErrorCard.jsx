import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND } from 'shared/theme';

export default function ErrorCard({ message, onRetry }) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{message || 'Something went wrong.'}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} accessibilityLabel="Retry" style={styles.btn}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: '#fff5f5', borderColor: BRAND.red, borderWidth: 1,
             borderRadius: BRAND.cardRadius, padding: 16, margin: 16, alignItems: 'center' },
  text:    { color: BRAND.red, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  btn:     { backgroundColor: BRAND.red, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '600' },
});
