'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  flatShippingRate: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountOwner?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  pinterestUrl?: string;
  xTwitterUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroLeftImage?: string;
  heroRightImage?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  homeFeaturedTitle?: string;
  homeViewAllLabel?: string;
  homeManifestoTitle?: string;
  homeManifestoText?: string;
  homeManifestoImage?: string;
  homeBannerText?: string;
  homeBannerButton?: string;
  archiveHeaderSub?: string;
  archiveQuoteTitle?: string;
  archiveQuoteText?: string;
  aboutHeroImage?: string;
  aboutHeading?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  aboutValuesTitle?: string;
  aboutValues?: Array<{ title: string; description: string }>;
  aboutQuote?: string;
  aboutQuoteText?: string;
  aboutStudioImage?: string;
  contactEmail?: string;
  waTemplatePending?: string;
  waTemplatePayment?: string;
  waTemplateShipping?: string;
  waTemplateRemind?: string;
  enabledCouriers?: string;
  originCityId?: string;
  originCityName?: string;
  originProvinceName?: string;
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
      heroTitle: 'EDITION 001',
      heroSubtitle: 'ARCHIVAL COTTON SILHOUETTE',
      heroLeftImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80',
      heroRightImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
      heroCtaText: 'Eksplor Koleksi Terkini',
      heroCtaLink: '/catalogue',

      setSettings: (settings) => set({ ...settings }),
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings }))
    }),
    {
      name: 'rio-store-settings'
    }
  )
);

// React Query to retrieve settings from native backend API
export function useStoreSettingsQuery() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/settings');
      if (data.code === 200 && data.data) {
        return data.data as StoreSettings;
      }
      return data as StoreSettings;
    }
  });
}
