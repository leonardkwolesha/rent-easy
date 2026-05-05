import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GRADIENTS, COLORS, SHADOW, SPACING } from '../theme';

// Floating chat-bubble button — fixed bottom-right, sits above bottom nav.
// Tapping opens the in-app AI assistant / support chat (handler provided
// by the consumer; we just render the button).
//
// Props:
//   onPress  : tap handler
//   bottom   : px from bottom (default 84 — clears the 64px bottom nav + 20px gap)
//   right    : px from right  (default 16)
export default function ChatFAB({ onPress, bottom = 84, right = SPACING.lg }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Open chat"
      style={[styles.wrap, { bottom, right }]}
    >
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    ...SHADOW.lg,
  },
  fab: {
    width:          56,
    height:         56,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
