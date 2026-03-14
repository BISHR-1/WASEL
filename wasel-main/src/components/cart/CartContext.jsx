import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveAbandonedCart } from '@/services/abandonedCart';
import { supabase } from '@/lib/supabase';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY_BASE = 'wasel_cart';
const CART_TIMESTAMP_KEY_BASE = 'wasel_cart_timestamp';

function getActiveIdentityScope() {
  try {
    const scope = localStorage.getItem('wasel_active_identity');
    return scope ? String(scope) : 'guest';
  } catch {
    return 'guest';
  }
}

function cartStorageKey() {
  return `${CART_STORAGE_KEY_BASE}:${getActiveIdentityScope()}`;
}

function cartTimestampKey() {
  return `${CART_TIMESTAMP_KEY_BASE}:${getActiveIdentityScope()}`;
}

function readCartFromScopedStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(cartStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return [];
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCartFromScopedStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(cartStorageKey(), JSON.stringify(cartItems || []));
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  useEffect(() => {
    const handleIdentityChanged = () => {
      setCartItems(readCartFromScopedStorage());
    };

    window.addEventListener('wasel_identity_changed', handleIdentityChanged);
    return () => {
      window.removeEventListener('wasel_identity_changed', handleIdentityChanged);
    };
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = async (item) => {
    if (!item || !item.id) {
      console.warn('Attempted to add invalid item to cart:', item);
      return;
    }
    setCartItems(prev => {
      const safeItems = Array.isArray(prev) ? prev : [];
      const existing = safeItems.find(i => i?.id === item.id);
      // Set timestamp when first item is added to cart
      if (safeItems.length === 0) {
        localStorage.setItem(cartTimestampKey(), Date.now().toString());
      }
      if (existing) {
        return safeItems.map(i =>
          i?.id === item.id
            ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
            : i
        );
      }
      return [...safeItems, { ...item, quantity: item.quantity || 1 }];
    });

    // حفظ السلة المتروكة في Supabase (بعد التحديث)
    try {
      // جلب بيانات المستخدم إذا كان مسجلاً
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      const userId = user?.id || null;
      const userEmail = user?.email || null;
      // جلب السلة الحالية من localStorage
      const cartRaw = localStorage.getItem(cartStorageKey());
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      // حساب المجموع
      const total = Array.isArray(cart) ? cart.reduce((sum, i) => {
        const price = i.customer_price ?? (i.price || 0);
        const quantity = Math.max(0, i.quantity || 1);
        return sum + (price * quantity);
      }, 0) : 0;
      // حفظ السلة فقط إذا فيها منتجات
      if (Array.isArray(cart) && cart.length > 0) {
        await saveAbandonedCart({
          cart,
          userId,
          userEmail,
          total,
          meta: { source: 'app', saved_at: new Date().toISOString() }
        });
      }
    } catch (err) {
      console.error('❌ خطأ في حفظ السلة المتروكة:', err);
    }
  };

  const removeFromCart = (itemId) => {
    if (!itemId) return;
    setCartItems(prev => {
      const safeItems = Array.isArray(prev) ? prev : [];
      return safeItems.filter(i => i?.id !== itemId);
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (!itemId || typeof quantity !== 'number') return;
    
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prev => {
      const safeItems = Array.isArray(prev) ? prev : [];
      return safeItems.map(i => 
        i?.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    const safeItems = Array.isArray(cartItems) ? cartItems : [];
    return safeItems.reduce((sum, item) => {
      if (!item) return sum;
      // customer_price is calculated at add-time.
      // If we don't have customer_price we fallback to price
      const price = item.customer_price ?? (item.price || 0);
      const quantity = Math.max(0, item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
  };

  const getTotalItems = () => {
    const safeItems = Array.isArray(cartItems) ? cartItems : [];
    return safeItems.reduce((sum, item) => sum + (Math.max(0, item?.quantity || 1)), 0);
  };

  // Delivery configuration
  // USD to SYP Exchange Rate
  // Rate used: 115 SYP (As requested by user)
  const USD_TO_SYP = 115; 
  // ✅ DELIVERY FEE for real payment
  const DELIVERY_FEE_USD = 6;
  const DELIVERY_FEE_SYP = DELIVERY_FEE_USD * USD_TO_SYP;

  const getFinalTotalSYP = () => {
    const total = getTotalPrice();
    return typeof total === 'number' ? total + DELIVERY_FEE_SYP : DELIVERY_FEE_SYP;
  };

  return (
    <CartContext.Provider value={{
      cartItems: Array.isArray(cartItems) ? cartItems : [],
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      getFinalTotalSYP,
      DELIVERY_FEE_SYP,
      DELIVERY_FEE_USD,
      USD_TO_SYP,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('useCart must be used within CartProvider. Using empty cart context.');
    return {
      cartItems: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getTotalPrice: () => 0,
      getTotalItems: () => 0,
      getFinalTotalSYP: () => 0,
      DELIVERY_FEE_SYP: 0,
      DELIVERY_FEE_USD: 6,
      USD_TO_SYP: 115,
      isCartOpen: false, 
      openCart: () => {},
      closeCart: () => {},
      toggleCart: () => {}
    };
  }
  return context;
}
