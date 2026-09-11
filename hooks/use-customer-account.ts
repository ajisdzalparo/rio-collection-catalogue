'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCustomerStore, type Customer } from '@/lib/customer-store';

export interface CustomerOrderItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  fullName: string;
  whatsapp: string;
  address: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: CustomerOrderItem[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  whatsapp?: string;
  address?: string;
  provinceName?: string;
  cityName?: string;
  cityId?: string;
  district?: string;
  postalCode?: string;
}

export interface SendOtpResponse {
  email: string;
  expiresAt: string;
  isDevMode?: boolean;
  message?: string;
}

export interface VerifyOtpResponse {
  customer: Customer;
  token: string;
}

export function useCustomerOrders() {
  const token = useCustomerStore((s) => s.token);
  const isAuthenticated = useCustomerStore((s) => s.isAuthenticated);

  return useQuery<CustomerOrder[], Error>({
    queryKey: ['customer', 'orders', token],
    queryFn: async () => {
      if (!token) return [];
      const { data } = await axios.get('/api/v1/customer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
    enabled: Boolean(isAuthenticated && token),
    staleTime: 1000 * 30 // 30 seconds cache
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  const token = useCustomerStore((s) => s.token);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);

  return useMutation<Customer, Error, UpdateProfilePayload>({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await axios.put('/api/v1/customer/me', payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (data.status !== 'success') {
        throw new Error(data.message || 'Gagal memperbarui profil.');
      }
      return data.data;
    },
    onSuccess: (updatedData) => {
      updateCustomer(updatedData);
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    }
  });
}

export function useSendCustomerOtp() {
  return useMutation<SendOtpResponse, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const { data } = await axios.post('/api/v1/customer/auth/send-otp', {
        email: email.trim()
      });
      if (data.status !== 'success') {
        throw new Error(data.message || 'Gagal mengirim OTP.');
      }
      return data.data;
    }
  });
}

export function useVerifyCustomerOtp() {
  const setAuth = useCustomerStore((s) => s.setAuth);

  return useMutation<
    VerifyOtpResponse,
    Error,
    { email: string; code: string; fullName?: string; whatsapp?: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await axios.post('/api/v1/customer/auth/verify-otp', payload);
      if (data.status !== 'success') {
        throw new Error(data.message || 'Verifikasi OTP gagal.');
      }
      return data.data;
    },
    onSuccess: (resData) => {
      setAuth(resData.customer, resData.token);
    }
  });
}
