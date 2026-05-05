import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, COLORS, FONT_WEIGHT } from '../theme';

// Initials avatar with orange gradient bg, or remote image if `uri` is set.
// size = full circle diameter in px. Text scales to ~40% of size.
//
// Variants:
//   'gradient' (default): orange→red bg, white initials — for cards / lists
//   'glass'             : translucent white bg — for use on a gradient header
export default function Avatar({ name, uri, size = 56, variant = 'gradient', style }) {
  const initials = initialsOf(name);
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[dim, styles.img, style]} />;
  }

  if (variant === 'glass') {
    return (
      <View style={[dim, styles.glass, style]}>
        <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[dim, styles.gradient, style]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </LinearGradient>
  );
}

function initialsOf(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

const styles = StyleSheet.create({
  gradient: { alignItems: 'center', justifyContent: 'center' },
  glass:    { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.25)' },
  img:      { backgroundColor: '#eee' },
  text:     { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
});
