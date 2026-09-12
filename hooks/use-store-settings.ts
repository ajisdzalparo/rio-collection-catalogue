'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface StoreSettings {
  storeName: string;
  logoUrl?: string | null;
  whatsappNumber: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountOwner?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  pinterestUrl?: string | null;
  xTwitterUrl?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroLayout?: 'single' | '2-grid' | '3-grid' | string | null;
  heroLeftImage?: string | null;
  heroCenterImage?: string | null;
  heroRightImage?: string | null;
  heroCtaText?: string | null;
  heroCtaLink?: string | null;
  homeFeaturedTitle?: string | null;
  homeViewAllLabel?: string | null;
  homeManifestoTitle?: string | null;
  homeManifestoText?: string | null;
  homeManifestoImage?: string | null;
  homeBannerText?: string | null;
  homeBannerButton?: string | null;
  archiveHeaderSub?: string | null;
  archiveQuoteTitle?: string | null;
  archiveQuoteText?: string | null;
  aboutHeroImage?: string | null;
  aboutHeading?: string | null;
  aboutParagraph1?: string | null;
  aboutParagraph2?: string | null;
  aboutValuesTitle?: string | null;
  aboutValues?: Array<{ title: string; description: string }> | null | unknown;
  aboutQuote?: string | null;
  aboutQuoteText?: string | null;
  aboutStudioImage?: string | null;
  contactEmail?: string | null;
  waTemplatePending?: string | null;
  waTemplatePayment?: string | null;
  waTemplateShipping?: string | null;
  waTemplateRemind?: string | null;
  enabledCouriers?: string | null;
  originCityId?: string | null;
  originCityName?: string | null;
  originProvinceName?: string | null;
}

interface StoreSettingsState extends StoreSettings {
  setSettings: (settings: StoreSettings) => void;
  updateSettings: (settings: Partial<StoreSettings>) => void;
}

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set) => ({
      storeName: '',
      logoUrl: '',
      whatsappNumber: '',
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      pinterestUrl: '',
      xTwitterUrl: '',
      heroTitle: '',
      heroSubtitle: '',
      heroLayout: '2-grid',
      heroLeftImage: '',
      heroCenterImage: '',
      heroRightImage: '',
      heroCtaText: '',
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
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/settings');
      if (data.code === 200 && data.data) {
        return data.data as StoreSettings;
      }
      return data as StoreSettings;
    }
  });
}
