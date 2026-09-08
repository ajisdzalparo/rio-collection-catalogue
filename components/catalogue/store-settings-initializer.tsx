'use client';

import { useEffect } from 'react';
import { useStoreSettingsStore, useStoreSettingsQuery, StoreSettings } from '@/hooks/use-store-settings';

interface StoreSettingsInitializerProps {
  settings: StoreSettings | null;
}

export function StoreSettingsInitializer({ settings }: StoreSettingsInitializerProps) {
  const { data } = useStoreSettingsQuery();
  useEffect(() => {
    if (data || settings) {
      useStoreSettingsStore.getState().setSettings((data || settings)!);
    }
  }, [settings, data]);

  return null;
}
