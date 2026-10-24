import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, Coupon } from '../types/index.js';
import { api } from '../services/api.js';

interface CartContextType {
  cartItems: CartItem[];
  activeRestaurantId: string | null;
  activeRestaurantName: string | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: MenuItem, restaurantName: string) => boolean;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  platformFee: number;
  finalTotal: number;
  itemCount: number;
  restaurantConflict: { item: MenuItem; restaurantName: string } | null;
  resolveConflict: (replace: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('zomato_cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(() => {
    return localStorage.getItem('zomato_cart_restaurant_id') || null;
  });

  const [activeRestaurantName, setActiveRestaurantName] = useState<string | null>(() => {
    return localStorage.getItem('zomato_cart_restaurant_name') || null;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const stored = localStorage.getItem('zomato_cart_coupon');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    return Number(localStorage.getItem('zomato_cart_discount')) || 0;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [restaurantConflict, setRestaurantConflict] = useState<{
    item: MenuItem;
    restaurantName: string;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zomato_cart_items', JSON.stringify(cartItems));
      if (activeRestaurantId) {
        localStorage.setItem('zomato_cart_restaurant_id', activeRestaurantId);
      } else {
        localStorage.removeItem('zomato_cart_restaurant_id');
      }
      if (activeRestaurantName) {
        localStorage.setItem('zomato_cart_restaurant_name', activeRestaurantName);
      } else {
        localStorage.removeItem('zomato_cart_restaurant_name');
      }
    } catch {
      // storage error
    }
  }, [cartItems, activeRestaurantId, activeRestaurantName]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 500 || cartItems.length === 0 ? 0 : 40;
  const platformFee = cartItems.length > 0 ? 5 : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const finalTotal = Math.max(0, Math.round((subtotal + deliveryFee + platformFee + tax - discountAmount) * 100) / 100);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Re-validate coupon if subtotal changes
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minimumOrderValue) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      localStorage.removeItem('zomato_cart_coupon');
      localStorage.removeItem('zomato_cart_discount');
    }
  }, [subtotal, appliedCoupon]);

  const addItem = (item: MenuItem, restaurantName: string): boolean => {
    if (cartItems.length > 0 && activeRestaurantId && activeRestaurantId !== item.restaurantId) {
      // Different restaurant - trigger conflict dialog
      setRestaurantConflict({ item, restaurantName });
      return false;
    }

    setActiveRestaurantId(item.restaurantId);
    setActiveRestaurantName(restaurantName);

    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          restaurantId: item.restaurantId,
          name: item.name,
          price: item.price,
          image: item.image,
          isVegetarian: item.isVegetarian,
          quantity: 1,
        },
      ];
    });

    return true;
  };

  const resolveConflict = (replace: boolean) => {
    if (replace && restaurantConflict) {
      const { item, restaurantName } = restaurantConflict;
      setActiveRestaurantId(item.restaurantId);
      setActiveRestaurantName(restaurantName);
      setCartItems([
        {
          menuItemId: item.id,
          restaurantId: item.restaurantId,
          name: item.name,
          price: item.price,
          image: item.image,
          isVegetarian: item.isVegetarian,
          quantity: 1,
        },
      ]);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }
    setRestaurantConflict(null);
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCartItems((prev) => {
      const target = prev.find((i) => i.menuItemId === menuItemId);
      if (!target) return prev;

      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        const remaining = prev.filter((i) => i.menuItemId !== menuItemId);
        if (remaining.length === 0) {
          setActiveRestaurantId(null);
          setActiveRestaurantName(null);
          setAppliedCoupon(null);
          setDiscountAmount(0);
        }
        return remaining;
      }

      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: newQty } : i
      );
    });
  };

  const removeItem = (menuItemId: string) => {
    setCartItems((prev) => {
      const remaining = prev.filter((i) => i.menuItemId !== menuItemId);
      if (remaining.length === 0) {
        setActiveRestaurantId(null);
        setActiveRestaurantName(null);
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
      return remaining;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveRestaurantId(null);
    setActiveRestaurantName(null);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    localStorage.removeItem('zomato_cart_items');
    localStorage.removeItem('zomato_cart_restaurant_id');
    localStorage.removeItem('zomato_cart_restaurant_name');
    localStorage.removeItem('zomato_cart_coupon');
    localStorage.removeItem('zomato_cart_discount');
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        coupon: Coupon;
        discountAmount: number;
      }>('/api/coupons/validate', {
        code,
        subtotal,
      });

      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setDiscountAmount(res.discountAmount);
        localStorage.setItem('zomato_cart_coupon', JSON.stringify(res.coupon));
        localStorage.setItem('zomato_cart_discount', res.discountAmount.toString());
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Could not apply coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    localStorage.removeItem('zomato_cart_coupon');
    localStorage.removeItem('zomato_cart_discount');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        activeRestaurantId,
        activeRestaurantName,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        subtotal,
        deliveryFee,
        tax,
        platformFee,
        finalTotal,
        itemCount,
        restaurantConflict,
        resolveConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
