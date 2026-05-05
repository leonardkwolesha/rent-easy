import { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../../../shared/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'restaurant-outline', title: 'Order from your favorites',
    text:  'Discover the best restaurants in Dar es Salaam and order in seconds.' },
  { icon: 'bicycle-outline',    title: 'Fast local delivery',
    text:  'Live tracking from kitchen to your door — no surprises.' },
  { icon: 'wallet-outline',     title: 'Pay your way',
    text:  'M-Pesa, Airtel Money, Tigo Pesa, or cash on delivery.' },
];

export default function Onboarding({ navigation }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  function next() {
    if (index < SLIDES.length - 1) {
      const n = index + 1;
      setIndex(n);
      listRef.current?.scrollToIndex({ index: n, animated: true });
    } else {
      navigation.replace('Login');
    }
  }

  return (
    <LinearGradient colors={BRAND.gradientPrimary} style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={() => navigation.replace('Login')}
        accessibilityLabel="Skip onboarding"
        style={styles.skip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Ionicons name={item.icon} size={120} color="#fff" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity onPress={next} accessibilityLabel="Next" style={styles.nextBtn}>
        <Text style={styles.nextText}>{index === SLIDES.length - 1 ? 'Get started' : 'Next'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  skip:      { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  skipText:  { color: '#fff', fontWeight: '600' },
  slide:     { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  title:     { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 32, textAlign: 'center' },
  text:      { color: '#fff', opacity: 0.9, marginTop: 12, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  dots:      { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#fff', width: 20 },
  nextBtn:   { backgroundColor: '#fff', marginHorizontal: 40, marginBottom: 56,
               padding: 16, borderRadius: BRAND.cardRadius, alignItems: 'center' },
  nextText:  { color: BRAND.orange, fontWeight: '700', fontSize: 16 },
});
