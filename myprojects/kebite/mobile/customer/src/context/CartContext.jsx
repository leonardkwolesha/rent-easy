import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getJSON, setJSON, KEYS } from '../../../shared/storage';

const EMPTY_CART = { items: [], restaurantId: null, restaurantName: '' };

const CartContext = createContext({
  cart:           EMPTY_CART,
  cartTotal:      0,
  cartCount:      0,
  addToCart:      () => {},
  removeFromCart: () => {},
  clearCart:      () => {},
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getJSON(KEYS.cart, EMPTY_CART);
      setCart(saved);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) setJSON(KEYS.cart, cart);
  }, [cart, hydrated]);

  const cartTotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  function _doAdd(item, restaurant) {
    setCart((prev) => {
      const existing = prev.items.find((i) => i._id === item._id);
      const newItems = existing
        ? prev.items.map((i) => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev.items, { ...item, quantity: 1 }];
      return { items: newItems, restaurantId: restaurant._id, restaurantName: restaurant.name };
    });
  }

  function addToCart(item, restaurant) {
    if (cart.restaurantId && cart.restaurantId !== restaurant._id && cart.items.length > 0) {
      Alert.alert(
        'Switch restaurant?',
        `Your cart has items from ${cart.restaurantName}. Clear it to add from ${restaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', style: 'destructive',
            onPress: () => {
              setCart(EMPTY_CART);
              setTimeout(() => _doAdd(item, restaurant), 0);
            } },
        ]
      );
      return;
    }
    _doAdd(item, restaurant);
  }

  function removeFromCart(itemId) {
    setCart((prev) => {
      const existing = prev.items.find((i) => i._id === itemId);
      if (!existing) return prev;
      const newItems = existing.quantity > 1
        ? prev.items.map((i) => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        : prev.items.filter((i) => i._id !== itemId);
      return newItems.length === 0 ? EMPTY_CART : { ...prev, items: newItems };
    });
  }

  function clearCart() { setCart(EMPTY_CART); }

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: EMPTY_CART, cartTotal: 0, cartCount: 0,
      addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {},
    };
  }
  return ctx;
}
