'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // generated as `${productId}-${size}-${color}`
  productId: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  isPreOrder?: boolean;
  availableStock?: number;
  maxQuantity?: number;
}

function clampQuantity(quantity: number, maxQuantity?: number) {
  const normalizedQuantity = Math.max(0, Math.floor(quantity));

  if (maxQuantity === undefined) return normalizedQuantity;

  return Math.min(normalizedQuantity, Math.max(0, Math.floor(maxQuantity)));
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const id = `${newItem.productId}-${newItem.size}-${newItem.color}`;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.id === id);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          const existingItem = updatedItems[existingIndex];
          const quantity = clampQuantity(
            existingItem.quantity + newItem.quantity,
            newItem.maxQuantity
          );

          if (quantity <= 0) return;

          updatedItems[existingIndex] = {
            ...existingItem,
            ...newItem,
            id,
            quantity
          };
          set({ items: updatedItems, isOpen: true });
        } else {
          const quantity = clampQuantity(newItem.quantity, newItem.maxQuantity);

          if (quantity <= 0) return;

          set({
            items: [...currentItems, { ...newItem, id, quantity }],
            isOpen: true
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id)
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity: clampQuantity(quantity, item.maxQuantity) }
              : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      }
    }),
    {
      name: 'rio_cart_storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);
