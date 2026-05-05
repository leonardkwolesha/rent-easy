import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../theme';

// Bottom tab bar matching the web design: 4 icons, active = orange with
// a 3px underline indicator. Use this when *not* relying on react-navigation's
// built-in tab bar (e.g. inside a single-screen app or for a custom design).
//
// For the customer / rider apps, we keep the react-navigation tab bar but pass
// these icons + label config to it. This component is for any screen that
// wants to render its own footer nav (e.g. the marketing landing screen).
//
// Props:
//   tabs       : Array<{ key, label, icon, onPress }>
//   activeKey  : currently selected tab
export default function BottomNavBar({ tabs = [], activeKey }) {
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={t.onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <Ionicons
              name={t.icon}
              size={22}
              color={active ? COLORS.activeOrange : COLORS.textLight}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {t.label}
            </Text>
            {active ? <View style={styles.underline} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    backgroundColor: COLORS.cardBg,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    paddingTop:      SPACING.sm,
    paddingBottom:   SPACING.sm,
    ...SHADOW.md,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position:       'relative',
  },
  label: {
    marginTop:  2,
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color:      COLORS.textLight,
  },
  labelActive: {
    color:      COLORS.activeOrange,
    fontWeight: FONT_WEIGHT.semibold,
  },
  underline: {
    position:        'absolute',
    bottom:          -SPACING.sm,
    height:          3,
    width:           28,
    borderRadius:    2,
    backgroundColor: COLORS.activeOrange,
  },
});
