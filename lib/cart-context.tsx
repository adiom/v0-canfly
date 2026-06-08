'use client';

import { CartItem } from '@/lib/types';
import { createContext, useContext, useState, useEffect } from 'react';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('canfly-cart');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from localStorage
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
     
    setMounted(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('canfly-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.bookId === newItem.bookId);
      if (existing) {
        return prev.map((item) =>
          item.bookId === newItem.bookId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (bookId: string) => {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(bookId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.bookId === bookId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
