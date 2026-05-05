import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';

// Centered empty / placeholder state with icon + message + optional CTA.
//
// Props:
//   icon        : Ionicons name (default 'sparkles-outline')
//   title       : main message
//   subtitle    : secondary line
//   ctaLabel    : if set, render an orange button
//   onCta       : button handler
//   compact     : tighter vertical padding (for cards inside lists)
export default function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  ctaLabel,
  onCta,
  compact = false,
}) {
  return (
    <View style={[styles.root, compact && { paddingVertical: SPACING.xl }]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={COLORS.activeOrange} />
      </View>
      {title    ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel ? (
        <TouchableOpacity onPress={onCta} style={styles.cta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: COLORS.pendingBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.md,
  },
  title: {
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color:      COLORS.dark,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:    FONT_SIZE.base,
    color:       COLORS.textMuted,
    textAlign:   'center',
    marginTop:   SPACING.xs,
    lineHeight:  20,
  },
  cta: {
    marginTop:         SPACING.lg,
    backgroundColor:   COLORS.activeOrange,
    paddingHorizontal: SPACING.xl,
    paddingVertical:   SPACING.md,
    borderRadius:      RADIUS.pill,
  },
  ctaText: {
    color:      COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize:   FONT_SIZE.base,
  },
});
