import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, BRAND, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import { formatMoney, formatPhone } from '../../../shared/formatters';
import PromoCodeInput from '../../../shared/components/PromoCodeInput';
import api from '../../../shared/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import ErrorCard from '../components/ErrorCard';

const PAYMENT_OPTIONS = [
  { id: 'mpesa',  label: 'M-Pesa',           icon: 'phone-portrait-outline', note: 'Recommended' },
  { id: 'airtel', label: 'Airtel Money',      icon: 'phone-portrait-outline', note: null },
  { id: 'tigo',   label: 'Tigo Pesa',         icon: 'phone-portrait-outline', note: null },
  { id: 'cash',   label: 'Cash on delivery',  icon: 'cash-outline',           note: null },
];

const DELIVERY_FEE = 2000;

export default function Checkout({ navigation }) {
  const { cart, cartTotal, cartCount, addToCart, removeFromCart, clearCart } = useCart();
  const { user }     = useAuth();
  const { t }        = useLang();
  const [address, setAddress]   = useState(user?.address || '');
  const [payment, setPayment]   = useState('mpesa');
  const [promo, setPromo]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const placedRef               = useRef(false);

  const discount   = promo
    ? (promo.discountType === 'percent'
        ? Math.round(cartTotal * (promo.discount / 100))
        : (promo.discount || 0))
    : 0;
  const grandTotal = cartTotal - discount + DELIVERY_FEE;

  async function placeOrder() {
    setError(null);
    if (!cart.items.length) { setError('Cart is empty.'); return; }
    if (!address.trim())    { setError('Please enter a delivery address.'); return; }
    if (grandTotal <= 0)    { setError('Order total must be greater than zero.'); return; }

    setLoading(true);
    try {
      const payload = {
        restaurantId:    cart.restaurantId,
        items:           cart.items.map((i) => ({ menuItemId: i._id, quantity: i.quantity })),
        deliveryAddress: address.trim(),
        paymentMethod:   payment,
        total:           grandTotal,
        promoCode:       promo?.code,
      };
      const res     = await api.post('/orders', payload);
      const orderId = res.data._id;

      if (payment !== 'cash' && user?.phone) {
        await api.post('/payments', {
          orderId,
          method: payment,
          phone:  formatPhone(user.phone),
          amount: grandTotal,
        }).catch(() => {});
      }

      placedRef.current = true;
      clearCart();
      navigation.replace('OrderTracking', { orderId });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!cart.items.length && !placedRef.current) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pageBg }}>
        <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
        <Text style={{ color: COLORS.textMuted, marginTop: SPACING.lg, fontSize: FONT_SIZE.md }}>
          Your cart is empty.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: SPACING.lg }}
          accessibilityLabel="Go back to browse"
        >
          <Text style={{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold }}>Browse restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your cart</Text>
        <Text style={styles.headerCount}>{cartCount} item{cartCount === 1 ? '' : 's'}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order items with qty controls */}
        <Text style={styles.section}>Order summary</Text>
        <View style={styles.card}>
          <Text style={styles.restaurantName}>{cart.restaurantName}</Text>

          {cart.items.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              {/* Quantity stepper */}
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => removeFromCart(item._id)}
                  accessibilityLabel={`Remove one ${item.name}`}
                  style={styles.stepBtn}
                >
                  <Ionicons name="remove" size={16} color={COLORS.activeOrange} />
                </TouchableOpacity>
                <Text style={styles.stepQty}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => addToCart(item, { _id: cart.restaurantId, name: cart.restaurantName })}
                  accessibilityLabel={`Add another ${item.name}`}
                  style={styles.stepBtn}
                >
                  <Ionicons name="add" size={16} color={COLORS.activeOrange} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatMoney(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.subLabel}>Subtotal</Text>
            <Text style={styles.subValue}>{formatMoney(cartTotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.subLabel, { color: COLORS.successText }]}>Promo discount</Text>
              <Text style={[styles.subValue, { color: COLORS.successText }]}>− {formatMoney(discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.subLabel}>Delivery fee</Text>
            <Text style={styles.subValue}>{formatMoney(DELIVERY_FEE)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(grandTotal)}</Text>
          </View>
        </View>

        {/* Promo code */}
        <Text style={styles.section}>Promo code</Text>
        <PromoCodeInput
          onApply={setPromo}
          strings={{ placeholder: t.promoPlaceholder, apply: t.promoApply, remove: t.promoRemove, error: t.promoError }}
        />

        {/* Delivery address */}
        <Text style={styles.section}>Delivery address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="House number, street, area — Dar es Salaam"
          placeholderTextColor={COLORS.textLight}
          multiline
          style={styles.addressInput}
        />

        {/* Payment method */}
        <Text style={styles.section}>Payment method</Text>
        {PAYMENT_OPTIONS.map((p) => {
          const active = payment === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPayment(p.id)}
              accessibilityLabel={`Pay with ${p.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.payRow, active && styles.payRowActive]}
            >
              <View style={[styles.payIconWrap, active && styles.payIconWrapActive]}>
                <Ionicons name={p.icon} size={20} color={active ? '#fff' : COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payLabel, active && styles.payLabelActive]}>{p.label}</Text>
                {p.note && <Text style={styles.payNote}>{p.note}</Text>}
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {error && <ErrorCard message={error} />}
      </ScrollView>

      {/* Place order CTA */}
      <TouchableOpacity
        onPress={placeOrder}
        disabled={loading}
        accessibilityLabel={`Place order for ${formatMoney(grandTotal)}`}
        activeOpacity={0.9}
        style={styles.ctaWrap}
      >
        <LinearGradient colors={GRADIENTS.primary} style={styles.cta}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Text style={styles.ctaText}>Place order</Text>
                <Text style={styles.ctaAmount}>{formatMoney(grandTotal)}</Text>
              </>
            )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop:        52,
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
  },
  headerTitle: { flex: 1, color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  headerCount: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.sm },

  section: {
    fontSize:   FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color:      COLORS.dark,
    marginTop:  SPACING.xl,
    marginBottom: SPACING.sm,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    ...SHADOW.sm,
  },
  restaurantName: {
    fontSize:    FONT_SIZE.sm,
    color:       COLORS.textMuted,
    fontWeight:  FONT_WEIGHT.medium,
    marginBottom:SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginVertical:SPACING.xs,
    gap:           SPACING.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.xs,
  },
  stepBtn: {
    width:           28,
    height:          28,
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     COLORS.activeOrange,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepQty: {
    width:      24,
    textAlign:  'center',
    color:      COLORS.dark,
    fontWeight: FONT_WEIGHT.bold,
    fontSize:   FONT_SIZE.base,
  },
  itemName:  { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZE.base },
  itemPrice: { color: COLORS.dark, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.base },
  divider:   { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  subLabel:  { color: COLORS.textMuted },
  subValue:  { color: COLORS.textBody },
  totalLabel:{ color: COLORS.dark, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  totalValue:{ color: COLORS.activeOrange, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.xl },

  addressInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    minHeight:       72,
    color:           COLORS.textPrimary,
    borderWidth:     1,
    borderColor:     COLORS.border,
    fontSize:        FONT_SIZE.base,
    textAlignVertical:'top',
    ...SHADOW.sm,
  },

  payRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    gap:             SPACING.md,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    ...SHADOW.sm,
  },
  payRowActive:    { borderColor: COLORS.activeOrange },
  payIconWrap:     { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.pageBg,
                     alignItems: 'center', justifyContent: 'center' },
  payIconWrapActive:{ backgroundColor: COLORS.activeOrange },
  payLabel:        { color: COLORS.dark, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  payLabelActive:  { color: COLORS.activeOrange },
  payNote:         { color: COLORS.successText, fontSize: FONT_SIZE.xs, marginTop: 2, fontWeight: FONT_WEIGHT.medium },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                     borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: COLORS.activeOrange },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.activeOrange },

  ctaWrap: {
    position:     'absolute',
    left:         SPACING.lg,
    right:        SPACING.lg,
    bottom:       SPACING.xxl,
    borderRadius: RADIUS.xl,
    overflow:     'hidden',
    ...SHADOW.lg,
  },
  cta: {
    paddingVertical:   SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  ctaText:   { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  ctaAmount: { color: 'rgba(255,255,255,0.9)', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
});
