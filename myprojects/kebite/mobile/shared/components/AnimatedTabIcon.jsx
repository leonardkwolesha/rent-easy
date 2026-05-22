import { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { tabBar } from '../theme';

/**
 * Shared animated tab icon for all three Kebite apps.
 * Uses React Native's built-in Animated API — no reanimated needed.
 *
 * Props:
 *   icon          ReactNode  — the Ionicons element (color handled by caller)
 *   label         string
 *   focused       boolean
 *   activePill    string     — pill fill color when active
 *   activeLabel   string     — label color when active
 *   inactiveLabel string     — label color when inactive
 */
export function AnimatedTabIcon({ icon, label, focused, activePill, activeLabel, inactiveLabel }) {
  const pillScale    = useRef(new Animated.Value(focused ? 1    : 0.7)).current;
  const pillOpacity  = useRef(new Animated.Value(focused ? 1    : 0  )).current;
  const iconScale    = useRef(new Animated.Value(focused ? 1.1  : 1  )).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1    : 0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale,  {
        toValue: focused ? 1 : 0.7,
        useNativeDriver: true,
        tension: 180,
        friction: 10,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: tabBar.animDuration,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        tension: 260,
        friction: 10,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0.5,
        duration: tabBar.animDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={{
      alignItems:        'center',
      justifyContent:    'center',
      paddingVertical:   7,
      paddingHorizontal: 14,
      minWidth:          tabBar.activePillW,
    }}>

      {/* Pill stretches to cover BOTH icon and label */}
      <Animated.View style={{
        position:        'absolute',
        top:             0,
        left:            0,
        right:           0,
        bottom:          0,
        borderRadius:    24,
        backgroundColor: activePill,
        opacity:         pillOpacity,
        transform:       [{ scale: pillScale }],
      }} />

      {/* Icon */}
      <Animated.View style={{
        zIndex:          1,
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    2,
        transform:       [{ scale: iconScale }],
      }}>
        {icon}
      </Animated.View>

      {/* Label */}
      <Animated.Text style={{
        fontSize:      10,
        fontWeight:    focused ? '700' : '400',
        color:         focused ? activeLabel : inactiveLabel,
        zIndex:        1,
        letterSpacing: 0.2,
        textAlign:     'center',
        opacity:       labelOpacity,
      }}>
        {label}
      </Animated.Text>

    </View>
  );
}
