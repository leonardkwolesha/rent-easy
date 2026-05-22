import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from 'shared/theme';

export default function SplashScreen({ navigation }) {
  const logoScale    = useRef(new Animated.Value(0.55)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const ctaOpacity   = useRef(new Animated.Value(0)).current;
  const ctaTranslate = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(ctaOpacity,   { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(ctaTranslate, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={GRADIENTS.primaryDeep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Decorative speed lines */}
      <View style={styles.linesWrap} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.speedLine, { top: 120 + i * 28, width: 40 + i * 20, opacity: 0.12 - i * 0.03 }]} />
        ))}
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconMark}>
          <Ionicons name="bicycle" size={54} color="#fff" />
        </View>
        <Text style={styles.wordmark}>kebite</Text>
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>rider</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Deliver.{'\n'}Earn. Repeat.
      </Animated.Text>

      {/* CTAs */}
      <Animated.View style={[styles.ctaBlock, { opacity: ctaOpacity, transform: [{ translateY: ctaTranslate }] }]}>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          accessibilityLabel="Start earning with Kebite Rider"
          accessibilityRole="button"
          style={styles.primaryBtn}
          activeOpacity={0.88}
        >
          <Ionicons name="bicycle" size={20} color={COLORS.orange} />
          <Text style={styles.primaryText}>Start earning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('Register')}
          accessibilityLabel="Register as a new rider"
          accessibilityRole="button"
          style={styles.ghostBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.ghostText}>New rider? Apply here</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footer}>M-Pesa payout · GPS tracking · Live orders</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  linesWrap: { position: 'absolute', left: SPACING.xl, right: 0 },
  speedLine: {
    position:        'absolute',
    height:          3,
    backgroundColor: '#fff',
    borderRadius:    2,
  },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  iconMark: {
    width:           92,
    height:          92,
    borderRadius:    28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.md,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.2,
    shadowRadius:    16,
    elevation:       8,
  },
  wordmark:  { color: '#fff', fontSize: 42, fontWeight: FONT_WEIGHT.heavy, letterSpacing: -1.5 },
  pillBadge: {
    marginTop:         SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical:   4,
    borderRadius:      RADIUS.pill,
    backgroundColor:   'rgba(255,255,255,0.2)',
  },
  pillText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 2, textTransform: 'uppercase' },
  tagline: {
    color:      '#fff',
    fontSize:   FONT_SIZE.xxxl,
    textAlign:  'center',
    lineHeight: 36,
    fontWeight: FONT_WEIGHT.heavy,
    marginBottom: SPACING.xxxl,
    letterSpacing:-0.5,
  },
  ctaBlock: {
    position:   'absolute',
    bottom:     64,
    left:       SPACING.xl,
    right:      SPACING.xl,
    alignItems: 'center',
    gap:        SPACING.md,
  },
  primaryBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#fff',
    borderRadius:    RADIUS.pill,
    paddingVertical: 16,
    width:           '100%',
    gap:             SPACING.sm,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.2,
    shadowRadius:    8,
    elevation:       6,
  },
  primaryText: { color: COLORS.orange, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  ghostBtn:    { paddingVertical: SPACING.sm },
  ghostText:   { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.base },
  footer: {
    position:  'absolute',
    bottom:    24,
    color:     'rgba(255,255,255,0.4)',
    fontSize:  FONT_SIZE.xs,
    textAlign: 'center',
  },
});
