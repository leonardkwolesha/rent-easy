import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../theme';

// Centred stat card — bold value on top, uppercase muted label below.
//
// Used in:
//   - Dashboard 4-up grids (Today's Orders / Revenue / etc.) → use `wide`
//   - Profile screen 3-up row → default
//
// Props:
//   value      : string or number (formatted by caller — use formatMoney)
//   label      : caption (auto-uppercased)
//   valueColor : override (defaults to dark)
//   compact    : tighter padding for inline 3-up rows
export default function StatCard({ value, label, valueColor, compact = false, style }) {
  return (
    <View style={[styles.card, compact && styles.compact, style]}>
      <Text style={[styles.value, compact && styles.valueCompact, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      <Text style={styles.label}>{String(label || '').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems:      'center',
    ...SHADOW.sm,
  },
  compact: {
    paddingVertical:   SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  value: {
    fontSize:   FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color:      COLORS.dark,
  },
  valueCompact: {
    fontSize: FONT_SIZE.lg,
  },
  label: {
    marginTop:     SPACING.xs,
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    color:         COLORS.textMuted,
    letterSpacing: 0.6,
  },
});
