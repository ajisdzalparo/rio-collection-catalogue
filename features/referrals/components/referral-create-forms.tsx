'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ReferralPartnerOption } from '../types';
import { ReferralPartnerForm } from './referral-partner-form';
import { ReferralCodeForm } from './referral-code-form';

interface ReferralCreateFormsProps {
  partners: ReferralPartnerOption[];
  onClose?: () => void;
  defaultPartnerId?: string;
  defaultTab?: 'partner' | 'code';
}

export function ReferralCreateForms({
  partners,
  onClose,
  defaultPartnerId,
  defaultTab = 'partner'
}: ReferralCreateFormsProps) {
  const [activeTab, setActiveTab] = useState<'partner' | 'code'>(defaultTab);

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden border-border/80 shadow-md bg-card/95 backdrop-blur-xs transition-all">
      {/* Header with Title and Close Button */}
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Pendaftaran Partner & Kode Referral
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Daftarkan partner kolaborasi baru atau terbitkan kupon diskon dan aturan komisi penjualan.
          </CardDescription>
        </div>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Tutup form"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'partner' | 'code')}
          className="w-full space-y-5"
        >
          <TabsList
            variant="pills"
            className="grid w-full grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border/60 max-w-sm mx-auto"
          >
            <TabsTrigger
              value="partner"
              variant="pills"
              className="py-2 text-xs font-semibold rounded-lg transition-all"
            >
              Partner Baru
            </TabsTrigger>

            <TabsTrigger
              value="code"
              variant="pills"
              className="py-2 text-xs font-semibold rounded-lg transition-all"
            >
              Kode Referral
              {partners.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground group-data-selected:bg-primary-foreground/20 group-data-selected:text-primary-foreground">
                  {partners.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Partner Baru */}
          <TabsContent value="partner" className="focus-visible:outline-hidden">
            <ReferralPartnerForm
              onSuccess={() => {
                // Success callback
              }}
              onCancel={onClose}
            />
          </TabsContent>

          {/* TAB 2: Kode Referral */}
          <TabsContent value="code" className="focus-visible:outline-hidden">
            {partners.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Belum Ada Partner Terdaftar</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Kode referral harus dikaitkan dengan satu partner. Daftarkan partner pertama Anda terlebih dahulu.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab('partner')}
                  className="font-semibold"
                >
                  Daftarkan Partner Sekarang
                </Button>
              </div>
            ) : (
              <ReferralCodeForm
                partners={partners}
                defaultPartnerId={defaultPartnerId}
                onSuccess={() => {
                  // Success callback
                }}
                onCancel={onClose}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
