import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney } from '../../../shared/formatters';
import api from '../../../shared/api';
import { useCart } from '../context/CartContext';
import ErrorCard from '../components/ErrorCard';

export default function RestaurantDetail({ route, navigation }) {
  const { id }                                         = route.params;
  const { addToCart, removeFromCart, cartCount, cart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState(null);

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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }
  if (error) {
    return <ErrorCard message={error} onRetry={() => navigation.replace('RestaurantDetail', { id })} />;
  }
  if (!restaurant) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} stickyHeaderIndices={[1]}>
        {/* Banner + info — index 0 */}
        <View>
          <Image
            source={{ uri: restaurant.image || `https://placehold.co/600x300/ff6b00/fff?text=🍽` }}
            style={styles.banner}
            resizeMode="cover"
            onError={() => {}}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.bannerOverlay}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.name}>{restaurant.name}</Text>
            {restaurant.cuisine ? <Text style={styles.cuisineTag}>{restaurant.cuisine}</Text> : null}
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color={COLORS.activeOrange} />
              <Text style={styles.meta}>{(restaurant.rating || 4.5).toFixed(1)}</Text>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.meta}>{restaurant.deliveryTime || '25–35'} min</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{formatMoney(restaurant.deliveryFee ?? 2000)} delivery</Text>
            </View>
          </View>
        </View>

        {/* Sticky tab bar — index 1, becomes sticky */}
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
                    <Text style={{ fontSize: 26 }}>🍽</Text>
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

      {/* Cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Checkout')}
          accessibilityLabel={`View cart — ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          activeOpacity={0.9}
          style={styles.cartBarWrap}
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
  banner:        { width: '100%', height: 220, backgroundColor: COLORS.border },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  backBtn: {
    position:        'absolute',
    top:             52,
    left:            SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.38)',
    padding:         SPACING.sm,
    borderRadius:    20,
  },
  infoCard: {
    backgroundColor:   COLORS.cardBg,
    padding:           SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  name:       { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  cuisineTag: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: 2 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: 4 },
  meta:       { color: COLORS.textBody, fontSize: FONT_SIZE.sm },
  dot:        { color: COLORS.border, marginHorizontal: 2 },

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
    bottom:       SPACING.xl,
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
