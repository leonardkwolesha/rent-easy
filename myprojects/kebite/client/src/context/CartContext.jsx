import { createContext, useContext, useState, useEffect } from 'react';

const EMPTY_CART = { items: [], restaurantId: null, restaurantName: '' }

const CartContext = createContext({
  cart:           EMPTY_CART,
  cartTotal:      0,
  cartCount:      0,
  addToCart:      () => {},
  removeFromCart: () => {},
  clearCart:      () => {},
  pendingAdd:     null,
  confirmSwitch:  () => {},
  cancelSwitch:   () => {},
});

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem('kebite_cart') || 'null') || { items: [], restaurantId: null, restaurantName: '' };
  } catch {
    return { items: [], restaurantId: null, restaurantName: '' };
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadSaved);
  const [pendingAdd, setPendingAdd] = useState(null);

  useEffect(() => {
    localStorage.setItem('kebite_cart', JSON.stringify(cart));
  }, [cart]);

  const cartTotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

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
      setPendingAdd({ item, restaurant });
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
      return newItems.length === 0
        ? { items: [], restaurantId: null, restaurantName: '' }
        : { ...prev, items: newItems };
    });
  }

  function clearCart() {
    setCart({ items: [], restaurantId: null, restaurantName: '' });
  }

  function confirmSwitch() {
    if (!pendingAdd) return;
    const { item, restaurant } = pendingAdd;
    setCart({ items: [], restaurantId: null, restaurantName: '' });
    setPendingAdd(null);
    setTimeout(() => _doAdd(item, restaurant), 0);
  }

  function cancelSwitch() {
    setPendingAdd(null);
  }

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, addToCart, removeFromCart, clearCart, pendingAdd, confirmSwitch, cancelSwitch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    console.error('useCart must be used inside CartProvider. Check that CartProvider wraps your routes in App.jsx')
    return {
      cart:           { items: [], restaurantId: null, restaurantName: '' },
      cartTotal:      0,
      cartCount:      0,
      addToCart:      () => {},
      removeFromCart: () => {},
      clearCart:      () => {},
      pendingAdd:     null,
      confirmSwitch:  () => {},
      cancelSwitch:   () => {},
    }
  }
  return context
}
