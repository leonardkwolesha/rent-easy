import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../../shared/theme';

// Restaurant-side splash uses the dark navy palette — signals a professional ops tool,
// not a consumer app.
const BG = ['#1a1a2e', '#16213e'];

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
    <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconMark}>
          <Ionicons name="restaurant" size={54} color={COLORS.orange} />
        </View>
        <Text style={styles.wordmark}>kebite</Text>
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>for restaurants</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Manage orders.{'\n'}Grow faster.
      </Animated.Text>

      {/* CTAs */}
      <Animated.View style={[styles.ctaBlock, { opacity: ctaOpacity, transform: [{ translateY: ctaTranslate }] }]}>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          accessibilityLabel="Sign in to your restaurant account"
          accessibilityRole="button"
          style={styles.primaryBtn}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryText}>Sign in to your restaurant</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.orange} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('Register')}
          accessibilityLabel="Register a new restaurant"
          accessibilityRole="button"
          style={styles.ghostBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.ghostText}>New restaurant? Register here</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footer}>Real-time orders · Menu manager · Earnings</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  logoWrap:  { alignItems: 'center', marginBottom: SPACING.xl },
  iconMark: {
    width:           88,
    height:          88,
    borderRadius:    24,
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderWidth:     1,
    borderColor:     'rgba(255,107,0,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.md,
  },
  wordmark:  { color: '#fff', fontSize: 42, fontWeight: FONT_WEIGHT.heavy, letterSpacing: -1.5 },
  pillBadge: {
    marginTop:         SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical:   4,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       'rgba(255,107,0,0.35)',
    backgroundColor:   'rgba(255,107,0,0.1)',
  },
  pillText: { color: COLORS.orange, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  tagline: {
    color:        'rgba(255,255,255,0.78)',
    fontSize:     FONT_SIZE.xxl,
    textAlign:    'center',
    lineHeight:   32,
    marginBottom: SPACING.xxxl,
    fontWeight:   FONT_WEIGHT.medium,
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
  primaryText: { color: COLORS.orange, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  ghostBtn:    { paddingVertical: SPACING.sm },
  ghostText:   { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.base },
  footer: {
    position:  'absolute',
    bottom:    24,
    color:     'rgba(255,255,255,0.3)',
    fontSize:  FONT_SIZE.xs,
    textAlign: 'center',
  },
});
