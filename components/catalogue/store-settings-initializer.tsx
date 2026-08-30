'use client';

import { useEffect } from 'react';
import { useStoreSettingsStore, StoreSettings } from '@/hooks/use-store-settings';

interface StoreSettingsInitializerProps {
  settings: StoreSettings | null;
}

export function StoreSettingsInitializer({ settings }: StoreSettingsInitializerProps) {
  useEffect(() => {
    if (settings) {
      useStoreSettingsStore.getState().setSettings(settings);
    }
  }, [settings]);

  return null;
}
