import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';

const STEPS = [
  { key: 'placed',     icon: 'receipt-outline',         label: 'Placed'     },
  { key: 'confirmed',  icon: 'checkmark-circle-outline', label: 'Confirmed'  },
  { key: 'preparing',  icon: 'flame-outline',            label: 'Preparing'  },
  { key: 'ready',      icon: 'bag-check-outline',        label: 'Ready'      },
  { key: 'on_the_way', icon: 'bicycle-outline',          label: 'On the way' },
  { key: 'delivered',  icon: 'home-outline',             label: 'Delivered'  },
];

// Compact horizontal order progress tracker.
// Place inside any screen that shows an active order status.
export default function OrderStatusBar({ status, style }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <View style={[styles.container, style]}>
      {STEPS.map((step, i) => {
        const reached   = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const hasLine   = i < STEPS.length - 1;

        return (
          <View key={step.key} style={styles.stepWrap}>
            {/* dot + connector */}
            <View style={styles.dotRow}>
              <View style={[styles.dot, reached && styles.dotReached, isCurrent && styles.dotCurrent]}>
                {reached ? (
                  <Ionicons name={isCurrent ? step.icon : 'checkmark'} size={isCurrent ? 12 : 10} color="#fff" />
                ) : null}
              </View>
              {hasLine && (
                <View style={[styles.line, i < currentIdx && styles.lineReached]} />
              )}
            </View>

            {/* label — only show current and adjacent to save space */}
            {(isCurrent || i === currentIdx - 1 || i === currentIdx + 1) && (
              <Text
                numberOfLines={1}
                style={[styles.label, isCurrent && styles.labelActive]}
              >
                {step.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.xs },
  stepWrap:  { flex: 1, alignItems: 'center' },
  dotRow:    { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dot: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1,
  },
  dotReached:  { backgroundColor: COLORS.activeOrange },
  dotCurrent:  { backgroundColor: COLORS.orange, width: 26, height: 26, borderRadius: 13,
                 borderWidth: 2, borderColor: 'rgba(255,107,0,0.25)' },
  line:        { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: -2 },
  lineReached: { backgroundColor: COLORS.activeOrange },
  label:       { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.xs,
                 fontWeight: FONT_WEIGHT.medium, textAlign: 'center' },
  labelActive: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold },
});
