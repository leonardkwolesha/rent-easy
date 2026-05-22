import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW, tabBar } from 'shared/theme';
import { formatMoney } from 'shared/formatters';
import api from 'shared/api';
import { useCart } from '../context/CartContext';
import ErrorCard from '../components/ErrorCard';

const HERO_H = 280;

export default function RestaurantDetail({ route, navigation }) {
  const { id }                                         = route.params;
  const { addToCart, removeFromCart, cartCount, cart } = useCart();
  const insets                                         = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState(null);
  const [imageError, setImageError] = useState(false);

  const infoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (restaurant) {
      Animated.timing(infoAnim, {
        toValue:         1,
        duration:        380,
        delay:           80,
        useNativeDriver: true,
      }).start();
    }
  }, [restaurant]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get(`/restaurants/${id}`);
        if (active) {
          setRestaurant(res.data);
          const firstCat = res.data?.menu?.[0]?.category ?? 'Main';
          setActiveTab(firstCat);
        }
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load restaurant.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const grouped = useMemo(() => {
    const out = {};
    (restaurant?.menu || []).forEach((item) => {
      const cat = item.category ?? 'Main';
      if (!out[cat]) out[cat] = [];
      out[cat].push(item);
    });
    return out;
  }, [restaurant]);

  const categories   = Object.keys(grouped);
  const visibleItems = activeTab ? (grouped[activeTab] || []) : [];

  function qtyInCart(itemId) {
    return cart.items.find((i) => i._id === itemId)?.quantity || 0;
  }

  // Tab bar is hidden on this screen (HIDDEN_ON) — only account for device safe area
  const cartBottom = insets.bottom + SPACING.lg;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.activeOrange} size="large" />
      </View>
    );
  }
  if (error) {
    return <ErrorCard message={error} onRetry={() => navigation.replace('RestaurantDetail', { id })} />;
  }
  if (!restaurant) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} stickyHeaderIndices={[1]}>

        {/* Hero — index 0 */}
        <View style={{ height: HERO_H }}>
          {/* Gradient fallback — always rendered behind image */}
          <LinearGradient
            colors={[COLORS.dark, COLORS.activeOrange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Placeholder icon when there is no image */}
          {(!restaurant.image || imageError) && (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="restaurant" size={72} color="rgba(255,255,255,0.22)" />
            </View>
          )}
          {/* Restaurant image */}
          {!!restaurant.image && (
            <Image
              source={{ uri: restaurant.image }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}
          {/* Bottom scrim for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.78)']}
            style={[StyleSheet.absoluteFill, { top: HERO_H * 0.35 }]}
          />
          {/* Back button — safe-area-aware */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Restaurant info — animated slide-up from hero bottom */}
          <Animated.View
            style={[
              styles.heroInfo,
              {
                opacity:   infoAnim,
                transform: [{
                  translateY: infoAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                }],
              },
            ]}
          >
            <Text style={styles.heroName} numberOfLines={2}>{restaurant.name}</Text>
            {restaurant.cuisine ? (
              <View style={styles.cuisinePill}>
                <Text style={styles.cuisinePillText}>{restaurant.cuisine}</Text>
              </View>
            ) : null}
            <View style={styles.heroMeta}>
              <Ionicons name="star" size={13} color="#FFD700" />
              <Text style={styles.heroMetaText}>{(restaurant.rating || 4.5).toFixed(1)}</Text>
              <Text style={styles.heroDot}>·</Text>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMetaText}>{restaurant.deliveryTime || '25–35'} min</Text>
              <Text style={styles.heroDot}>·</Text>
              <Text style={styles.heroMetaText}>{formatMoney(restaurant.deliveryFee ?? 2000)} delivery</Text>
            </View>
          </Animated.View>
        </View>

        {/* Sticky category tab bar — index 1 */}
        <View style={styles.tabBarWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {categories.map((cat) => {
              const active = cat === activeTab;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveTab(cat)}
                  accessibilityLabel={`${cat} menu items`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={styles.tab}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat}</Text>
                  {active && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Item list — index 2+ */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
          {visibleItems.map((item) => {
            const qty = qtyInCart(item._id);
            return (
              <View key={item._id} style={styles.itemCard}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" onError={() => {}} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="restaurant-outline" size={26} color={COLORS.textMuted} />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
                </View>

                {qty > 0 ? (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item._id)}
                      accessibilityLabel={`Remove one ${item.name}`}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.activeOrange} />
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() => addToCart(item, restaurant)}
                      accessibilityLabel={`Add another ${item.name}`}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="add" size={18} color={COLORS.activeOrange} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => addToCart(item, restaurant)}
                    accessibilityLabel={`Add ${item.name} to cart`}
                    style={styles.addBtn}
                  >
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Cart bar — floats above the tab bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Checkout')}
          accessibilityLabel={`View cart — ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          activeOpacity={0.9}
          style={[styles.cartBarWrap, { bottom: cartBottom }]}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.cartBar}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>View cart</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backBtn: {
    position:        'absolute',
    left:            SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.38)',
    padding:         SPACING.sm,
    borderRadius:    20,
    zIndex:          10,
  },
  heroInfo: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.lg,
  },
  heroName: {
    fontSize:         FONT_SIZE.xxl,
    fontWeight:       FONT_WEIGHT.bold,
    color:            '#fff',
    textShadowColor:  'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cuisinePill: {
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      12,
    paddingHorizontal: 10,
    paddingVertical:   3,
    marginTop:         5,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.35)',
  },
  cuisinePillText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  heroMeta:     { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, gap: 4 },
  heroMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: FONT_SIZE.sm },
  heroDot:      { color: 'rgba(255,255,255,0.45)', marginHorizontal: 2 },

  tabBarWrap: {
    backgroundColor:   COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBar: { paddingHorizontal: SPACING.md },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    position:          'relative',
  },
  tabText:       { color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  tabTextActive: { color: COLORS.activeOrange },
  tabUnderline: {
    position:        'absolute',
    bottom:          0,
    left:            SPACING.lg,
    right:           SPACING.lg,
    height:          2,
    backgroundColor: COLORS.activeOrange,
    borderRadius:    1,
  },

  itemCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    gap:             SPACING.md,
    ...SHADOW.sm,
  },
  itemImage: {
    width:           80,
    height:          80,
    borderRadius:    RADIUS.md,
    backgroundColor: COLORS.border,
    flexShrink:      0,
  },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemName:  { fontSize: FONT_SIZE.md,  fontWeight: FONT_WEIGHT.semibold, color: COLORS.dark },
  itemDesc:  { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: 2, lineHeight: 18 },
  itemPrice: { color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.xs },

  addBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: COLORS.activeOrange,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexShrink: 0 },
  qtyBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     COLORS.activeOrange,
    alignItems:      'center',
    justifyContent:  'center',
  },
  qtyNum: {
    color:      COLORS.dark,
    fontWeight: FONT_WEIGHT.bold,
    minWidth:   20,
    textAlign:  'center',
    fontSize:   FONT_SIZE.base,
  },

  cartBarWrap: {
    position:     'absolute',
    left:         SPACING.lg,
    right:        SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow:     'hidden',
    ...SHADOW.lg,
  },
  cartBar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        SPACING.lg,
  },
  cartBadge: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  cartBadgeText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  cartBarText:   { flex: 1, color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, textAlign: 'center' },
});
