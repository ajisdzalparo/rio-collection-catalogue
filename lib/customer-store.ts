'use client';

import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  email: string;
  fullName: string | null;
  whatsapp: string | null;
  address: string | null;
  cityId: string | null;
  cityName: string | null;
  provinceName: string | null;
  district: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerState {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (customer: Customer, token: string) => void;
  updateCustomer: (customer: Partial<Customer>) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (customer, token) => {
        // Set cookie on client
        if (typeof document !== 'undefined') {
          document.cookie = `customer_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
        set({ customer, token, isAuthenticated: true, isLoading: false });
      },

      updateCustomer: (updatedFields) => {
        const current = get().customer;
        if (current) {
          set({ customer: { ...current, ...updatedFields } });
        }
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({ customer: null, token: null, isAuthenticated: false, isLoading: false });
      },

      fetchProfile: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true });
        try {
          const { data } = await axios.get('/api/v1/customer/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (data.status === 'success' && data.data) {
            set({ customer: data.data, isAuthenticated: true, isLoading: false });
          } else {
            get().logout();
          }
        } catch {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'rio_customer_session',
      partialize: (state) => ({ customer: state.customer, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
);
