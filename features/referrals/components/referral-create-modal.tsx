'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { ReferralPartnerView } from '../types';
import { ReferralPartnerForm } from './referral-partner-form';
import { ReferralCodeForm } from './referral-code-form';

interface ReferralCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: ReferralPartnerView[];
  defaultPartnerId?: string;
  defaultTab?: 'partner' | 'code';
}

export function ReferralCreateModal({
  open,
  onOpenChange,
  partners,
  defaultPartnerId,
  defaultTab = 'partner'
}: ReferralCreateModalProps) {
  const [activeTab, setActiveTab] = useState<'partner' | 'code'>(defaultTab);

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-y-auto no-scrollbar p-6 sm:p-8">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Pendaftaran Partner & Kode Referral
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Daftarkan partner baru atau terbitkan kode promo beserta aturan komisinya.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
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
                className="py-1.5 text-xs font-semibold rounded-lg transition-all"
              >
                Partner Baru
              </TabsTrigger>

              <TabsTrigger
                value="code"
                variant="pills"
                className="py-1.5 text-xs font-semibold rounded-lg transition-all"
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
              <ReferralPartnerForm onSuccess={handleClose} onCancel={handleClose} />
            </TabsContent>

            {/* TAB 2: Kode Referral */}
            <TabsContent value="code" className="focus-visible:outline-hidden">
              {partners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      Belum Ada Partner Terdaftar
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Kode referral harus dikaitkan dengan satu partner. Daftarkan partner pertama
                      Anda terlebih dahulu.
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
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
