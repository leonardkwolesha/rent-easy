import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';
import { formatMoney } from '../formatters';

// Reusable restaurant card used across Home and Restaurants screens.
// Displays image, name, rating, delivery time, and fee.
export default function RestaurantCard({ restaurant, onPress, style }) {
  const isOpen = restaurant.isOpen !== false;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityLabel={`Open ${restaurant.name}`}
      accessibilityRole="button"
      style={[styles.card, style]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: restaurant.image || `https://placehold.co/400x200/ff6b00/fff?text=🍽` }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {}}
        />
        <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
          <Text style={[styles.badgeText, isOpen ? styles.openText : styles.closedText]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
        {restaurant.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="flame" size={11} color="#fff" />
            <Text style={styles.featuredText}>Popular</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        {restaurant.cuisine ? (
          <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine}</Text>
        ) : null}
        <View style={styles.meta}>
          <Ionicons name="star" size={13} color={COLORS.activeOrange} />
          <Text style={styles.metaText}>{(restaurant.rating || 4.5).toFixed(1)}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{restaurant.deliveryTime || '25–35'} min</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{formatMoney(restaurant.deliveryFee ?? 2000)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    marginBottom:    SPACING.md,
    overflow:        'hidden',
    ...SHADOW.md,
  },
  imageWrap:    { position: 'relative' },
  image:        { width: '100%', height: 148, backgroundColor: COLORS.border },
  statusBadge:  { position: 'absolute', top: SPACING.sm, left: SPACING.sm,
                  paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.pill },
  openBadge:    { backgroundColor: COLORS.successBg },
  closedBadge:  { backgroundColor: COLORS.errorBg },
  badgeText:    { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  openText:     { color: COLORS.successText },
  closedText:   { color: COLORS.errorText },
  featuredBadge:{ position: 'absolute', top: SPACING.sm, right: SPACING.sm,
                  flexDirection: 'row', alignItems: 'center', gap: 3,
                  backgroundColor: COLORS.activeOrange,
                  paddingHorizontal: SPACING.sm, paddingVertical: 4,
                  borderRadius: RADIUS.pill },
  featuredText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  body:         { padding: SPACING.md },
  name:         { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  cuisine:      { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  meta:         { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, gap: 4 },
  metaText:     { fontSize: FONT_SIZE.sm, color: COLORS.textBody },
  dot:          { color: COLORS.border, marginHorizontal: 2 },
});
