import { View, Text, StyleSheet } from 'react-native';
import { STATUS_BADGE, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';

// Pill badge keyed by status name (looked up in STATUS_BADGE).
// Falls back to a custom { label, bg, text } if `status` isn't in the map
// or if you pass `bg` / `text` / `label` directly.
//
// Examples:
//   <Badge status="delivered" />
//   <Badge status="open" />
//   <Badge label="Kebite Member TZ" bg="rgba(255,255,255,0.25)" text="#fff" />
export default function Badge({ status, label, bg, text, size = 'md', style }) {
  const preset = status ? STATUS_BADGE[status] : null;
  const finalBg    = bg    ?? preset?.bg    ?? '#f3f4f6';
  const finalText  = text  ?? preset?.text  ?? '#374151';
  const finalLabel = label ?? preset?.label ?? status ?? '';

  const sizing = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;

  return (
    <View style={[styles.root, sizing, { backgroundColor: finalBg }, style]}>
      <Text style={[styles.text, { color: finalText, fontSize: size === 'sm' ? FONT_SIZE.xs : FONT_SIZE.sm }]}>
        {finalLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf:    'flex-start',
    borderRadius: RADIUS.pill,
  },
  sm: { paddingHorizontal: SPACING.sm,  paddingVertical: 2 },
  md: { paddingHorizontal: SPACING.md,  paddingVertical: 4 },
  lg: { paddingHorizontal: SPACING.lg,  paddingVertical: 6 },
  text: { fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.2 },
});
