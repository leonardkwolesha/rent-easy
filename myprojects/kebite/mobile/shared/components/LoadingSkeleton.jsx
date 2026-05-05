import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

// Animated shimmer placeholder. Mirrors the web shimmer (efefef → f5f5f5 → efefef
// translating across at 1.4s) using opacity instead of background-position
// because RN doesn't support gradient animation cheaply.
//
// Use compositions for richer skeletons:
//   <LoadingSkeleton w="100%" h={120} />
//   <LoadingSkeleton w="60%" h={16} mt={12} />
//
// Or use the OrderCardSkeleton convenience export.
export default function LoadingSkeleton({
  w = '100%',
  h = 16,
  radius = RADIUS.sm,
  mt = 0, mb = 0,
  style,
}) {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: w, height: h, borderRadius: radius, marginTop: mt, marginBottom: mb, opacity },
        style,
      ]}
    />
  );
}

// Convenience: 3-row card skeleton matching OrderCard layout.
export function OrderCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LoadingSkeleton w={40} h={40} radius={20} />
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <LoadingSkeleton w="60%" h={14} />
          <LoadingSkeleton w="30%" h={10} mt={6} />
        </View>
        <LoadingSkeleton w={60} h={20} radius={10} />
      </View>
      <LoadingSkeleton w="90%" h={12} mt={SPACING.md} />
      <LoadingSkeleton w="50%" h={16} mt={SPACING.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
  },
});
