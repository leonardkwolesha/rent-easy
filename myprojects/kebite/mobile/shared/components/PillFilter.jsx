import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';

// Horizontal scrollable pill filter — used for category filters and status tabs.
//
// Props:
//   options   : Array<string | { value, label, count? }>
//   value     : current selected value
//   onChange  : (value) => void
//   size      : 'sm' | 'md' (default 'md')
export default function PillFilter({ options = [], value, onChange, size = 'md', style }) {
  const norm = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { count: undefined, ...o }
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {norm.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange?.(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.pill,
              size === 'sm' && styles.pillSm,
              active ? styles.pillActive : styles.pillInactive,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                size === 'sm' && { fontSize: FONT_SIZE.sm },
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {opt.label}
              {opt.count != null ? `  ·  ${opt.count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={{ width: SPACING.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.sm,
  },
  pill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
  },
  pillSm: { paddingHorizontal: SPACING.md, paddingVertical: 6 },
  pillActive:   { backgroundColor: COLORS.activeOrange, borderColor: COLORS.activeOrange },
  pillInactive: { backgroundColor: COLORS.cardBg,       borderColor: COLORS.border },
  label:         { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  labelActive:   { color: COLORS.white },
  labelInactive: { color: COLORS.textBody },
});
