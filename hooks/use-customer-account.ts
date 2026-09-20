'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCustomerStore, type Customer } from '@/lib/customer-store';

function getApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return new Error(message);
  }
  return error instanceof Error ? error : new Error(fallback);
}

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
  discountAmount?: number;
  referralCodeSnapshot?: string | null;
  status: string;
  createdAt: string;
  items: CustomerOrderItem[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  address?: string;
  provinceName?: string;
  cityName?: string;
  cityId?: string;
  district?: string;
  postalCode?: string;
}

export interface WhatsappChangePayload {
  whatsapp: string;
  otpCode: string;
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

export function useCustomerProfile() {
  const token = useCustomerStore((s) => s.token);
  const isAuthenticated = useCustomerStore((s) => s.isAuthenticated);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const logout = useCustomerStore((s) => s.logout);

  return useQuery<Customer | null, Error>({
    queryKey: ['customer', 'profile', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const { data } = await axios.get('/api/v1/customer/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.status === 'success' && data.data) {
          updateCustomer(data.data);
          return data.data;
        }
        logout();
        return null;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
        }
        throw getApiError(err, 'Gagal mengambil data profil');
      }
    },
    enabled: Boolean(isAuthenticated && token),
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });
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

export function useRequestWhatsappChangeOtp() {
  const token = useCustomerStore((s) => s.token);

  return useMutation<SendOtpResponse, Error, { whatsapp: string }>({
    mutationFn: async ({ whatsapp }) => {
      try {
        const { data } = await axios.post(
          '/api/v1/customer/me/whatsapp',
          { whatsapp: whatsapp.trim() },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }
        );
        if (data.status !== 'success') {
          throw new Error(data.message || 'Gagal mengirim kode OTP.');
        }
        return data.data;
      } catch (error) {
        throw getApiError(error, 'Gagal mengirim kode OTP.');
      }
    }
  });
}

export function useUpdateCustomerWhatsapp() {
  const queryClient = useQueryClient();
  const token = useCustomerStore((s) => s.token);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);

  return useMutation<Customer, Error, WhatsappChangePayload>({
    mutationFn: async ({ whatsapp, otpCode }) => {
      try {
        const { data } = await axios.put(
          '/api/v1/customer/me/whatsapp',
          { whatsapp: whatsapp.trim(), otpCode: otpCode.trim() },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }
        );
        if (data.status !== 'success') {
          throw new Error(data.message || 'Gagal memperbarui nomor WhatsApp.');
        }
        return data.data;
      } catch (error) {
        throw getApiError(error, 'Gagal memperbarui nomor WhatsApp.');
      }
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
      try {
        const { data } = await axios.post('/api/v1/customer/auth/send-otp', {
          email: email.trim()
        });
        if (data.status !== 'success') {
          throw new Error(data.message || 'Gagal mengirim OTP.');
        }
        return data.data;
      } catch (error) {
        throw getApiError(error, 'Gagal mengirim OTP.');
      }
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
      try {
        const { data } = await axios.post('/api/v1/customer/auth/verify-otp', payload);
        if (data.status !== 'success') {
          throw new Error(data.message || 'Verifikasi OTP gagal.');
        }
        return data.data;
      } catch (error) {
        throw getApiError(error, 'Verifikasi OTP gagal.');
      }
    },
    onSuccess: (resData) => {
      setAuth(resData.customer, resData.token);
    }
  });
}

export function useSendOrderOtp() {
  return useMutation<SendOtpResponse, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      try {
        const { data } = await axios.post('/api/v1/auth/otp/send', {
          email: email.trim(),
          type: 'ORDER'
        });
        if (data.status !== 'success') {
          throw new Error(data.message || 'Gagal mengirim OTP.');
        }
        return data.data || data;
      } catch (error) {
        throw getApiError(error, 'Gagal mengirim OTP.');
      }
    }
  });
}

export function useVerifyOrderOtp() {
  return useMutation<boolean, Error, { email: string; code: string }>({
    mutationFn: async ({ email, code }) => {
      try {
        const { data } = await axios.post('/api/v1/auth/otp/verify', {
          email: email.trim(),
          code: code.trim(),
          type: 'ORDER'
        });
        if (data.status !== 'success') {
          throw new Error(data.message || 'Kode OTP tidak valid.');
        }
        return true;
      } catch (error) {
        throw getApiError(error, 'Kode OTP tidak valid.');
      }
    }
  });
}
