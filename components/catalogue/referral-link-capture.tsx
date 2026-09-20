'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { normalizeReferralCode, REFERRAL_STORAGE_KEY } from '@/lib/referral';

export function ReferralLinkCapture() {
  const searchParams = useSearchParams();
  const code = searchParams.get('ref');

  useEffect(() => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    if (code) {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalizeReferralCode(code));
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [code]);

  return null;
}
