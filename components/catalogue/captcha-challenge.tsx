'use client';

import React, { useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { env } from '@/config/env';

interface CaptchaChallengeProps {
  onVerify: (verified: boolean, token?: string) => void;
  isVerified: boolean;
}

export function CaptchaChallenge({ onVerify, isVerified }: CaptchaChallengeProps) {
  const [siteKey, setSiteKey] = useState<string>(env.recaptchaSiteKey || '');
  const [isLoading, setIsLoading] = useState(!env.recaptchaSiteKey);
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    // If siteKey was not baked at build time, fetch it dynamically from server at runtime
    if (!siteKey) {
      fetch('/api/v1/public-config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.recaptchaSiteKey) {
            setSiteKey(data.recaptchaSiteKey);
          }
        })
        .catch((err) => console.error('Failed to load recaptcha config:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [siteKey]);

  useEffect(() => {
    if (!isProduction && !isVerified) {
      onVerify(true, 'dev-testing-token');
    }
  }, [isProduction, isVerified, onVerify]);

  const handleCaptchaChange = (value: string | null) => {
    if (value) {
      onVerify(true, value);
    } else {
      onVerify(!isProduction, isProduction ? '' : 'dev-testing-token');
    }
  };

  const handleCaptchaExpired = () => {
    onVerify(!isProduction, isProduction ? '' : 'dev-testing-token');
  };

  if (!isProduction) {
    return (
      <div className="py-2 text-[11px] text-muted-foreground flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Mode Testing: Verifikasi Keamanan (CAPTCHA) otomatis aktif.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-2 text-[12px] text-muted-foreground animate-pulse">
        Memuat verifikasi keamanan...
      </div>
    );
  }

  if (!siteKey) {
    return (
      <div className="py-2 text-[12px] text-amber-500">
        Konfigurasi reCAPTCHA belum tersedia di server.
      </div>
    );
  }

  return (
    <div className="py-2">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={handleCaptchaChange}
        onExpired={handleCaptchaExpired}
        onErrored={handleCaptchaExpired}
        theme="light"
      />
    </div>
  );
}
