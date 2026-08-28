'use client';

import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { env } from '@/config/env';

interface CaptchaChallengeProps {
  onVerify: (verified: boolean, token?: string) => void;
  isVerified: boolean;
}

export function CaptchaChallenge({ onVerify }: CaptchaChallengeProps) {
  const siteKey = env.recaptchaSiteKey;

  const handleCaptchaChange = (value: string | null) => {
    if (value) {
      onVerify(true, value);
    } else {
      onVerify(false);
    }
  };

  const handleCaptchaExpired = () => {
    onVerify(false);
  };

  return (
    <div className="py-2">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={handleCaptchaChange}
        onExpired={handleCaptchaExpired}
        theme="light"
      />
    </div>
  );
}
