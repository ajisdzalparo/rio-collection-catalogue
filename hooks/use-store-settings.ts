'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { env } from '@/config/env';

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  flatShippingRate: number;
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  pinterestUrl?: string;
  xTwitterUrl?: string;
}

interface StoreSettingsState extends StoreSettings {
  setSettings: (settings: StoreSettings) => void;
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set) => ({
      storeName: '',
      whatsappNumber: '',
      flatShippingRate: 0,
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      pinterestUrl: '',
      xTwitterUrl: '',

      setSettings: (settings) => set({ ...settings }),
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings }))
    }),
    {
      name: 'rio-store-settings'
    }
  )
);

// React Query to retrieve settings from VeloMock API
export function useStoreSettingsQuery() {
  return useQuery({
    queryKey: ['mock-settings'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/settings`);
      if (data.code === 200 && data.data) {
        return data.data as StoreSettings;
      }
      return data as StoreSettings;
    }
  });
}
