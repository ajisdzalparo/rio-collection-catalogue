'use client';

import React, { useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { env } from '@/config/env';

interface CaptchaChallengeProps {
  onVerify: (verified: boolean, token?: string) => void;
  isVerified: boolean;
}

export function CaptchaChallenge({ onVerify, isVerified }: CaptchaChallengeProps) {
  const siteKey = env.recaptchaSiteKey;
  const isProduction = process.env.NODE_ENV === 'production';

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
