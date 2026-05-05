import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../../shared/theme';

export default function SplashScreen({ navigation }) {
  const logoScale    = useRef(new Animated.Value(0.55)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const ctaOpacity   = useRef(new Animated.Value(0)).current;
  const ctaTranslate = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo pops in with spring
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      // 2. Tagline fades in
      Animated.timing(tagOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      // 3. CTA slides up
      Animated.parallel([
        Animated.timing(ctaOpacity,    { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(ctaTranslate,  { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Logo mark + wordmark */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconMark}>
          <Ionicons name="restaurant" size={54} color={COLORS.orange} />
        </View>
        <Text style={styles.wordmark}>kebite</Text>
        <View style={styles.dotRow}>
          <View style={styles.dotOrange} />
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Dar es Salaam's food,{'\n'}delivered to your door
      </Animated.Text>

      {/* CTA block */}
      <Animated.View style={[styles.ctaBlock, { opacity: ctaOpacity, transform: [{ translateY: ctaTranslate }] }]}>
        <TouchableOpacity
          onPress={() => navigation.replace('Onboarding')}
          accessibilityLabel="Get started with Kebite"
          accessibilityRole="button"
          style={styles.getStartedBtn}
          activeOpacity={0.9}
        >
          <Text style={styles.getStartedText}>Get started</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.orange} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          accessibilityLabel="Sign in to your account"
          accessibilityRole="button"
          style={styles.signinLink}
          activeOpacity={0.75}
        >
          <Text style={styles.signinText}>Already have an account? </Text>
          <Text style={[styles.signinText, { fontWeight: FONT_WEIGHT.bold }]}>Sign in</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom tagline */}
      <Text style={styles.bottomNote}>M-Pesa · Airtel Money · Tigo Pesa · Cash</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  logoWrap: {
    alignItems:   'center',
    marginBottom: SPACING.xl,
  },
  iconMark: {
    width:           92,
    height:          92,
    borderRadius:    28,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.lg,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.18,
    shadowRadius:    16,
    elevation:       10,
  },
  wordmark: {
    color:          '#fff',
    fontSize:       44,
    fontWeight:     FONT_WEIGHT.heavy,
    letterSpacing:  -1.5,
  },
  dotRow:     { flexDirection: 'row', marginTop: SPACING.xs },
  dotOrange:  { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  tagline: {
    color:        'rgba(255,255,255,0.88)',
    fontSize:     FONT_SIZE.lg,
    textAlign:    'center',
    lineHeight:   26,
    marginBottom: SPACING.xxxl,
  },
  ctaBlock: {
    position:  'absolute',
    bottom:    64,
    left:      SPACING.xl,
    right:     SPACING.xl,
    alignItems:'center',
    gap:       SPACING.lg,
  },
  getStartedBtn: {
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
    shadowOpacity:   0.15,
    shadowRadius:    8,
    elevation:       6,
  },
  getStartedText: {
    color:      COLORS.orange,
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  signinLink: { flexDirection: 'row' },
  signinText: {
    color:    'rgba(255,255,255,0.82)',
    fontSize: FONT_SIZE.base,
  },
  bottomNote: {
    position:  'absolute',
    bottom:    24,
    color:     'rgba(255,255,255,0.45)',
    fontSize:  FONT_SIZE.xs,
    textAlign: 'center',
  },
});
