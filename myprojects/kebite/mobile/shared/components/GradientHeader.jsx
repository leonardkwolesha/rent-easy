import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GRADIENTS, COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme';

// Drop-in gradient header used by every screen that has the orange→red top.
// Renders title, optional subtitle, optional back button, and optional right slot.
//
// Props:
//   title        : main heading (required)
//   subtitle     : muted line under the title
//   onBack       : if provided, shows ← chevron
//   right        : ReactNode rendered on the right (e.g. toggle, button)
//   children     : extra content inside the header (e.g. embedded search bar)
//   variant      : 'gradient' | 'dark' — restaurant uses 'dark' (#1a1a2e)
//   colors       : custom gradient — overrides variant
//   topInset     : safe-area top padding (default 48 — adjust per device)
//   compact      : tighter vertical rhythm
export default function GradientHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  variant = 'gradient',
  colors,
  topInset = 48,
  compact = false,
}) {
  const Wrapper = variant === 'dark' ? View : LinearGradient;
  const wrapperProps = variant === 'dark'
    ? { style: [styles.root, { backgroundColor: COLORS.dark, paddingTop: topInset, paddingBottom: compact ? SPACING.lg : SPACING.xxl }] }
    : { colors: colors || GRADIENTS.primary, start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
        style: [styles.root, { paddingTop: topInset, paddingBottom: compact ? SPACING.lg : SPACING.xxl }] };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityLabel="Back" hitSlop={8} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 1 }} />}
        {right ? <View>{right}</View> : null}
      </View>

      <View style={{ paddingHorizontal: SPACING.lg, marginTop: onBack || right ? SPACING.sm : 0 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: SPACING.lg,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    minHeight:      28,
  },
  back: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 4,
  },
  backText: {
    color:    COLORS.white,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: 2,
  },
  title: {
    color:    COLORS.white,
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    color:    'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZE.base,
    marginTop: 2,
  },
});
