'use client';

import React, { useState } from 'react';
import { Save, ShoppingBag, Share2, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VStack, Flex } from '@/components/ui/layout';
import { useStoreSettingsStore, useStoreSettingsQuery, type StoreSettings } from '@/hooks/use-store-settings';
import { ImageUpload } from '@/components/shared/image-upload';
import { toast } from 'sonner';

import axios from 'axios';

export default function StoreSettingsPage() {
  const { data: mockSettings } = useStoreSettingsQuery();

  const storeNameStore = useStoreSettingsStore((s) => s.storeName);
  const whatsappNumberStore = useStoreSettingsStore((s) => s.whatsappNumber);
  const flatShippingRateStore = useStoreSettingsStore((s) => s.flatShippingRate);
  const instagramUrlStore = useStoreSettingsStore((s) => s.instagramUrl || '');
  const tiktokUrlStore = useStoreSettingsStore((s) => s.tiktokUrl || '');
  const facebookUrlStore = useStoreSettingsStore((s) => s.facebookUrl || '');
  const pinterestUrlStore = useStoreSettingsStore((s) => s.pinterestUrl || '');
  const xTwitterUrlStore = useStoreSettingsStore((s) => s.xTwitterUrl || '');

  const heroTitleStore = useStoreSettingsStore((s) => s.heroTitle || 'EDITION 001');
  const heroSubtitleStore = useStoreSettingsStore((s) => s.heroSubtitle || 'Eksplorasi siluet dan tekstur dalam jumlah terbatas.');
  const heroLeftImageStore = useStoreSettingsStore((s) => s.heroLeftImage || '');
  const heroRightImageStore = useStoreSettingsStore((s) => s.heroRightImage || '');
  const heroCtaTextStore = useStoreSettingsStore((s) => s.heroCtaText || 'Eksplor Koleksi');
  const heroCtaLinkStore = useStoreSettingsStore((s) => s.heroCtaLink || '/catalogue');

  const setSettings = useStoreSettingsStore((s) => s.setSettings);
  const updateSettings = useStoreSettingsStore((s) => s.updateSettings);

  const [storeName, setStoreName] = useState(storeNameStore);
  const [whatsappNumber, setWhatsappNumber] = useState(whatsappNumberStore);
  const [flatShippingRate] = useState(flatShippingRateStore);
  const [instagramUrl, setInstagramUrl] = useState(instagramUrlStore);
  const [tiktokUrl, setTiktokUrl] = useState(tiktokUrlStore);
  const [facebookUrl, setFacebookUrl] = useState(facebookUrlStore);
  const [pinterestUrl, setPinterestUrl] = useState(pinterestUrlStore);
  const [xTwitterUrl, setXTwitterUrl] = useState(xTwitterUrlStore);

  const [heroTitle, setHeroTitle] = useState(heroTitleStore);
  const [heroSubtitle, setHeroSubtitle] = useState(heroSubtitleStore);
  const [heroLeftImage, setHeroLeftImage] = useState(heroLeftImageStore);
  const [heroRightImage, setHeroRightImage] = useState(heroRightImageStore);
  const [heroCtaText, setHeroCtaText] = useState(heroCtaTextStore);
  const [heroCtaLink, setHeroCtaLink] = useState(heroCtaLinkStore);

  const [isSaving, setIsSaving] = useState(false);
  const [prevMockSettings, setPrevMockSettings] = useState<StoreSettings | undefined>(undefined);

  // Sync database API data to Zustand store and local form state once fetched
  if (mockSettings && mockSettings !== prevMockSettings) {
    setPrevMockSettings(mockSettings);
    setSettings(mockSettings);
    setStoreName(mockSettings.storeName || '');
    setWhatsappNumber(mockSettings.whatsappNumber || '');
    setInstagramUrl(mockSettings.instagramUrl || '');
    setTiktokUrl(mockSettings.tiktokUrl || '');
    setFacebookUrl(mockSettings.facebookUrl || '');
    setPinterestUrl(mockSettings.pinterestUrl || '');
    setXTwitterUrl(mockSettings.xTwitterUrl || '');

    if (mockSettings.heroTitle) setHeroTitle(mockSettings.heroTitle);
    if (mockSettings.heroSubtitle) setHeroSubtitle(mockSettings.heroSubtitle);
    if (mockSettings.heroLeftImage) setHeroLeftImage(mockSettings.heroLeftImage);
    if (mockSettings.heroRightImage) setHeroRightImage(mockSettings.heroRightImage);
    if (mockSettings.heroCtaText) setHeroCtaText(mockSettings.heroCtaText);
    if (mockSettings.heroCtaLink) setHeroCtaLink(mockSettings.heroCtaLink);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        storeName,
        whatsappNumber,
        flatShippingRate: Number(flatShippingRate),
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        pinterestUrl,
        xTwitterUrl,
        heroTitle,
        heroSubtitle,
        heroLeftImage,
        heroRightImage,
        heroCtaText,
        heroCtaLink
      };
      await axios.put('/api/v1/settings', payload);
      updateSettings(payload);
      toast.success('Pengaturan toko, Hero Section & media sosial berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Gagal menyimpan pengaturan toko ke database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack gap="lg" className="pb-10 w-full">
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Store Settings & CMS</h1>
        <p className="text-sm text-muted-foreground pt-1">
          Atur profil toko, Banner Hero Katalog Utama, media sosial, dan kontak WhatsApp.
        </p>
      </VStack>

      <div className="space-y-5 max-w-3xl">
        {/* Card 1: Hero Section CMS Settings */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-border/20 pb-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            Hero Banner Katalog Depan (CMS)
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hero-title" className="text-xs font-bold text-foreground">
                  Judul Hero (Judul Utama)
                </Label>
                <Input
                  id="hero-title"
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="h-10 rounded-xl font-bold"
                  placeholder="EDITION 001"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-subtitle" className="text-xs font-bold text-foreground">
                  Sub-judul / Deskripsi Singkat
                </Label>
                <Input
                  id="hero-subtitle"
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="h-10 rounded-xl"
                  placeholder="Eksplorasi siluet dan tekstur dalam jumlah terbatas."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hero-cta-text" className="text-xs font-bold text-foreground">
                  Teks Tombol CTA Utama
                </Label>
                <Input
                  id="hero-cta-text"
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  className="h-10 rounded-xl"
                  placeholder="Eksplor Koleksi"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-cta-link" className="text-xs font-bold text-foreground">
                  Link Tombol CTA
                </Label>
                <Input
                  id="hero-cta-link"
                  type="text"
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  className="h-10 rounded-xl"
                  placeholder="/catalogue"
                />
              </div>
            </div>

            {/* Hero Images Uploaders (Left & Right Column images) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground block">
                  Foto Banner Kiri (Model / Campaign)
                </Label>
                <ImageUpload
                  value={heroLeftImage}
                  onChange={setHeroLeftImage}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground block">
                  Foto Banner Kanan (Tekstur / Fabric)
                </Label>
                <ImageUpload
                  value={heroRightImage}
                  onChange={setHeroRightImage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: General Info */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-border/20 pb-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground/75" />
            Profil Toko & WhatsApp Admin
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="store-name" className="text-xs font-bold text-foreground">
                Nama Toko / Catalog Title
              </Label>
              <Input
                id="store-name"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wa-number" className="text-xs font-bold text-foreground">
                Nomor WhatsApp Admin (Format 62...)
              </Label>
              <Input
                id="wa-number"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="h-10 rounded-xl"
                placeholder="628123456789"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Social Media Links */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 border-b border-border/20 pb-2">
            <Share2 className="h-4 w-4 text-muted-foreground/75" />
            Tautan Media Sosial Toko
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ig-url" className="text-xs font-bold text-foreground">
                Instagram URL
              </Label>
              <Input
                id="ig-url"
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
                placeholder="https://instagram.com/username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tiktok-url" className="text-xs font-bold text-foreground">
                TikTok URL
              </Label>
              <Input
                id="tiktok-url"
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
                placeholder="https://tiktok.com/@username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pinterest-url" className="text-xs font-bold text-foreground">
                Pinterest URL
              </Label>
              <Input
                id="pinterest-url"
                type="text"
                value={pinterestUrl}
                onChange={(e) => setPinterestUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
                placeholder="https://pinterest.com/username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-url" className="text-xs font-bold text-foreground">
                Facebook URL
              </Label>
              <Input
                id="fb-url"
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
                placeholder="https://facebook.com/page"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="x-url" className="text-xs font-bold text-foreground">
                X (Twitter) URL
              </Label>
              <Input
                id="x-url"
                type="text"
                value={xTwitterUrl}
                onChange={(e) => setXTwitterUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
                placeholder="https://x.com/username"
              />
            </div>
          </div>
        </div>

        {/* Save Trigger Row aligned with card */}
        <Flex justify="end" className="pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 h-11 px-6 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan CMS'}</span>
          </Button>
        </Flex>
      </div>
    </VStack>
  );
}
