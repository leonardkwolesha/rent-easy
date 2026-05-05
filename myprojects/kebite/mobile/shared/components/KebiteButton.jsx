import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';

const SIZE = {
  sm: { py: 10, px: SPACING.lg,  fontSize: FONT_SIZE.sm  },
  md: { py: 14, px: SPACING.xl,  fontSize: FONT_SIZE.base },
  lg: { py: 16, px: SPACING.xxl, fontSize: FONT_SIZE.lg  },
};

// variant: 'primary' | 'outline' | 'ghost'
// size:    'sm' | 'md' | 'lg'
export default function KebiteButton({
  label, onPress, loading = false,
  variant = 'primary', size = 'md',
  disabled = false, style, accessibilityLabel,
}) {
  const s     = SIZE[size] || SIZE.md;
  const isOff = loading || disabled;

  const inner = loading
    ? <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.activeOrange} size="small" />
    : <Text style={[styles.label, styles[`label_${variant}`], { fontSize: s.fontSize }]}>{label}</Text>;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isOff}
        activeOpacity={0.82}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole="button"
        style={[{ borderRadius: RADIUS.pill, overflow: 'hidden', opacity: isOff ? 0.55 : 1 }, style]}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: s.py, paddingHorizontal: s.px, alignItems: 'center', justifyContent: 'center' }}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isOff}
      activeOpacity={0.75}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      style={[
        styles.base,
        styles[`base_${variant}`],
        { paddingVertical: s.py, paddingHorizontal: s.px, opacity: isOff ? 0.55 : 1 },
        style,
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:            { borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  base_outline:    { borderWidth: 1.5, borderColor: COLORS.activeOrange, backgroundColor: 'transparent' },
  base_ghost:      { borderWidth: 0,   backgroundColor: 'transparent' },
  label:           { fontWeight: FONT_WEIGHT.bold },
  label_primary:   { color: COLORS.white },
  label_outline:   { color: COLORS.activeOrange },
  label_ghost:     { color: COLORS.activeOrange },
});
