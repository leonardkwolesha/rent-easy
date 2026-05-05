import { View, Text, TextInput, StyleSheet } from 'react-native';
import { BRAND } from '../../../shared/theme';

export default function PhoneInput({ value, onChangeText, placeholder = 'Phone number' }) {
  function handleChange(text) {
    const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
    onChangeText(digits);
  }
  return (
    <View style={styles.row}>
      <View style={styles.prefix}><Text style={styles.prefixText}>+255</Text></View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        style={styles.input}
        maxLength={9}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                borderRadius: BRAND.cardRadius, borderColor: '#eee', borderWidth: 1,
                overflow: 'hidden', marginBottom: 12 },
  prefix:     { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#f8f8f8',
                borderRightWidth: 1, borderRightColor: '#eee' },
  prefixText: { fontSize: 16, fontWeight: '600', color: BRAND.dark },
  input:      { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: BRAND.dark },
});
