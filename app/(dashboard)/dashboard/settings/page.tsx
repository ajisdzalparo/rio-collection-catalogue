'use client';

import React, { useState } from 'react';
import {
  Save,
  ShoppingBag,
  Share2,
  LayoutTemplate,
  CreditCard,
  Home,
  BookOpen,
  Mail,
  MessageSquare,
  Truck,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VStack } from '@/components/ui/layout';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { useStoreSettingsStore, useStoreSettingsQuery } from '@/hooks/use-store-settings';
import { ImageUpload } from '@/components/shared/image-upload';
import { cn } from '@/lib/utils';
import { StoreBanksManager } from '@/components/dashboard/store-banks-manager';
import {
  WhatsAppTemplateEditor,
  DEFAULT_WA_TEMPLATES,
  type WhatsAppTemplates
} from '@/components/dashboard/whatsapp-template-editor';
import { INDONESIA_MASTER_LOCATIONS } from '@/lib/indonesia-locations';
import { DashboardSearchableSelect } from '@/components/dashboard/dashboard-searchable-select';
import { toast } from 'sonner';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

type SettingsTab =
  'profile' | 'couriers' | 'whatsapp' | 'payments' | 'socials' | 'hero' | 'homepage' | 'pages';

const ALL_COURIERS_LIST = [
  { code: 'jne', name: 'JNE Express', desc: 'Jalur Nugraha Ekakurir' },
  { code: 'pos', name: 'POS Indonesia', desc: 'PT POS Indonesia' },
  { code: 'tiki', name: 'TIKI', desc: 'Titipan Kilat' },
  { code: 'sicepat', name: 'SiCepat Ekspres', desc: 'SiCepat Ekspres Indonesia' },
  { code: 'jnt', name: 'J&T Express', desc: 'J&T Express Indonesia' },
  { code: 'anteraja', name: 'Anteraja', desc: 'PT Tri Adi Bersama' },
  { code: 'wahana', name: 'Wahana Express', desc: 'Wahana Prestasi Logistik' },
  { code: 'lion', name: 'Lion Parcel', desc: 'Lion Parcel' },
  { code: 'ninja', name: 'Ninja Xpress', desc: 'Ninja Logistics' },
  { code: 'ide', name: 'ID Express', desc: 'ID Express Indonesia' }
];

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { data: mockSettings, isLoading: loadingSettings } = useStoreSettingsQuery();
  const setSettings = useStoreSettingsStore((s) => s.setSettings);
  const updateSettings = useStoreSettingsStore((s) => s.updateSettings);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form local state
  const [storeName, setStoreName] = useState('RIO COLLECTION');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');
  const [contactEmail, setContactEmail] = useState('');
  const [enabledCouriers, setEnabledCouriers] = useState<string>('jne,pos,tiki,sicepat,jnt');
  const [originProvinceName, setOriginProvinceName] = useState<string>('JAWA BARAT');
  const [originCityId, setOriginCityId] = useState<string>('153');
  const [originCityName, setOriginCityName] = useState<string>('Bandung');

  // WhatsApp Follow-Up Templates state
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplates>(DEFAULT_WA_TEMPLATES);

  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [xTwitterUrl, setXTwitterUrl] = useState('');

  const [heroTitle, setHeroTitle] = useState('EDITION 001');
  const [heroSubtitle, setHeroSubtitle] = useState('ARCHIVAL COTTON SILHOUETTE');
  const [heroLayout, setHeroLayout] = useState<'single' | '2-grid' | '3-grid'>('2-grid');
  const [heroLeftImage, setHeroLeftImage] = useState('');
  const [heroCenterImage, setHeroCenterImage] = useState('');
  const [heroRightImage, setHeroRightImage] = useState('');
  const [heroCtaText, setHeroCtaText] = useState('Eksplor Koleksi Terkini');
  const [heroCtaLink, setHeroCtaLink] = useState('/catalogue');

  const [homeFeaturedTitle, setHomeFeaturedTitle] = useState('');
  const [homeViewAllLabel, setHomeViewAllLabel] = useState('');
  const [homeManifestoTitle, setHomeManifestoTitle] = useState('');
  const [homeManifestoText, setHomeManifestoText] = useState('');
  const [homeManifestoImage, setHomeManifestoImage] = useState('');
  const [homeBannerText, setHomeBannerText] = useState('');
  const [homeBannerButton, setHomeBannerButton] = useState('');

  const [archiveHeaderSub, setArchiveHeaderSub] = useState('');
  const [archiveQuoteTitle, setArchiveQuoteTitle] = useState('');
  const [archiveQuoteText, setArchiveQuoteText] = useState('');

  const [aboutHeroImage, setAboutHeroImage] = useState('');
  const [aboutHeading, setAboutHeading] = useState('');
  const [aboutParagraph1, setAboutParagraph1] = useState('');
  const [aboutParagraph2, setAboutParagraph2] = useState('');
  const [aboutValuesTitle, setAboutValuesTitle] = useState('');
  const [aboutValues, setAboutValues] = useState<Array<{ title: string; description: string }>>([]);
  const [aboutQuote, setAboutQuote] = useState('');
  const [aboutQuoteText, setAboutQuoteText] = useState('');
  const [aboutStudioImage, setAboutStudioImage] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const [prevSettings, setPrevSettings] = useState<typeof mockSettings | null>(null);

  if (mockSettings && mockSettings !== prevSettings) {
    setPrevSettings(mockSettings);
    setSettings(mockSettings);
    if (mockSettings.storeName) setStoreName(mockSettings.storeName);
    if (mockSettings.whatsappNumber) setWhatsappNumber(mockSettings.whatsappNumber);
    if (mockSettings.contactEmail) setContactEmail(mockSettings.contactEmail);
    if (mockSettings.enabledCouriers) setEnabledCouriers(mockSettings.enabledCouriers);
    if (mockSettings.originProvinceName) setOriginProvinceName(mockSettings.originProvinceName);
    if (mockSettings.originCityId) setOriginCityId(mockSettings.originCityId);
    if (mockSettings.originCityName) setOriginCityName(mockSettings.originCityName);

    setWaTemplates({
      waTemplatePending: mockSettings.waTemplatePending || DEFAULT_WA_TEMPLATES.waTemplatePending,
      waTemplatePayment: mockSettings.waTemplatePayment || DEFAULT_WA_TEMPLATES.waTemplatePayment,
      waTemplateShipping:
        mockSettings.waTemplateShipping || DEFAULT_WA_TEMPLATES.waTemplateShipping,
      waTemplateRemind: mockSettings.waTemplateRemind || DEFAULT_WA_TEMPLATES.waTemplateRemind
    });

    setInstagramUrl(mockSettings.instagramUrl || '');
    setTiktokUrl(mockSettings.tiktokUrl || '');
    setFacebookUrl(mockSettings.facebookUrl || '');
    setPinterestUrl(mockSettings.pinterestUrl || '');
    setXTwitterUrl(mockSettings.xTwitterUrl || '');

    setHeroTitle(mockSettings.heroTitle || 'EDITION 001');
    setHeroSubtitle(mockSettings.heroSubtitle || 'ARCHIVAL COTTON SILHOUETTE');
    setHeroLayout((mockSettings.heroLayout as 'single' | '2-grid' | '3-grid') || '2-grid');
    setHeroLeftImage(mockSettings.heroLeftImage || '');
    setHeroCenterImage(mockSettings.heroCenterImage || '');
    setHeroRightImage(mockSettings.heroRightImage || '');
    setHeroCtaText(mockSettings.heroCtaText || 'Eksplor Koleksi Terkini');
    setHeroCtaLink(mockSettings.heroCtaLink || '/catalogue');

    setHomeFeaturedTitle(mockSettings.homeFeaturedTitle || '');
    setHomeViewAllLabel(mockSettings.homeViewAllLabel || '');
    setHomeManifestoTitle(mockSettings.homeManifestoTitle || '');
    setHomeManifestoText(mockSettings.homeManifestoText || '');
    setHomeManifestoImage(mockSettings.homeManifestoImage || '');
    setHomeBannerText(mockSettings.homeBannerText || '');
    setHomeBannerButton(mockSettings.homeBannerButton || '');

    setArchiveHeaderSub(mockSettings.archiveHeaderSub || '');
    setArchiveQuoteTitle(mockSettings.archiveQuoteTitle || '');
    setArchiveQuoteText(mockSettings.archiveQuoteText || '');

    setAboutHeroImage(mockSettings.aboutHeroImage || '');
    setAboutHeading(mockSettings.aboutHeading || '');
    setAboutParagraph1(mockSettings.aboutParagraph1 || '');
    setAboutParagraph2(mockSettings.aboutParagraph2 || '');
    setAboutValuesTitle(mockSettings.aboutValuesTitle || '');
    setAboutValues(Array.isArray(mockSettings.aboutValues) ? mockSettings.aboutValues : []);
    setAboutQuote(mockSettings.aboutQuote || '');
    setAboutQuoteText(mockSettings.aboutQuoteText || '');
    setAboutStudioImage(mockSettings.aboutStudioImage || '');
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        storeName,
        whatsappNumber,
        contactEmail,
        waTemplatePending: waTemplates.waTemplatePending,
        waTemplatePayment: waTemplates.waTemplatePayment,
        waTemplateShipping: waTemplates.waTemplateShipping,
        waTemplateRemind: waTemplates.waTemplateRemind,
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        pinterestUrl,
        xTwitterUrl,
        heroTitle,
        heroSubtitle,
        heroLayout,
        heroLeftImage,
        heroCenterImage,
        heroRightImage,
        heroCtaText,
        heroCtaLink,
        homeFeaturedTitle,
        homeViewAllLabel,
        homeManifestoTitle,
        homeManifestoText,
        homeManifestoImage,
        homeBannerText,
        homeBannerButton,
        archiveHeaderSub,
        archiveQuoteTitle,
        archiveQuoteText,
        aboutHeroImage,
        aboutHeading,
        aboutParagraph1,
        aboutParagraph2,
        aboutValuesTitle,
        aboutValues,
        aboutQuote,
        aboutQuoteText,
        aboutStudioImage,
        enabledCouriers,
        originProvinceName,
        originCityId,
        originCityName
      };
      const { data } = await axios.put('/api/v1/settings', payload);
      updateSettings(data.data);
      queryClient.setQueryData(['store-settings'], data.data);
      toast.success('Pengaturan toko & ekspedisi berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Gagal menyimpan pengaturan toko ke database');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCourier = (code: string) => {
    const activeList = enabledCouriers
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    let newList: string[];
    if (activeList.includes(code)) {
      newList = activeList.filter((c) => c !== code);
    } else {
      newList = [...activeList, code];
    }
    setEnabledCouriers(newList.join(','));
  };

  const tabsNav = [
    { id: 'profile', label: 'Profil Toko & Kontak', icon: ShoppingBag },
    { id: 'couriers', label: 'Ekspedisi & Kurir', icon: Truck },
    { id: 'whatsapp', label: 'Template Followup WA', icon: MessageSquare },
    { id: 'payments', label: 'Rekening Pembayaran', icon: CreditCard },
    { id: 'socials', label: 'Media Sosial', icon: Share2 },
    { id: 'hero', label: 'Banner Hero CMS', icon: LayoutTemplate },
    { id: 'homepage', label: 'Homepage CMS', icon: Home },
    { id: 'pages', label: 'Archive & About CMS', icon: BookOpen }
  ] as const;

  return (
    <VStack gap="lg" className="pb-12 w-full">
      {/* Header */}
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Store Settings & CMS
        </h1>
        <p className="text-sm text-muted-foreground pt-1">
          Kelola profil toko, rekening pembayaran, media sosial, dan konfigurasi konten publik
          secara rapi.
        </p>
      </VStack>

      {/* Mobile Tab Selector (Dropdown for easy 1-touch navigation) */}
      <div className="sm:hidden w-full">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
          Menu Pengaturan:
        </label>
        <Select value={activeTab} onValueChange={(val) => val && setActiveTab(val as SettingsTab)}>
          <SelectTrigger className="w-full h-11 px-3.5 rounded-lg bg-card border-border/60 text-foreground text-xs font-bold shadow-2xs">
            <SelectValue placeholder="Pilih Menu Pengaturan" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl">
            {tabsNav.map((tab) => {
              const Icon = tab.icon;
              return (
                <SelectItem
                  key={tab.id}
                  value={tab.id}
                  className="text-xs font-medium py-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{tab.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Navigation Tabs Bar */}
      <div className="hidden sm:flex items-center gap-1.5 p-1.5 bg-card border border-border/40 rounded-2xl overflow-x-auto shadow-2xs">
        {tabsNav.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap select-none ${
                isActive
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6 w-full pt-1">
        {loadingSettings ? (
          <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
            Memuat data pengaturan toko...
          </div>
        ) : (
          <>
            {/* TAB: Template Followup WA */}
            {activeTab === 'whatsapp' && (
              <WhatsAppTemplateEditor
                templates={waTemplates}
                onChange={setWaTemplates}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}

            {/* TAB 1: Profil Toko & Kontak */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-border/20 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Profil Toko, Kontak WhatsApp &amp; Shipping
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name" className="text-xs font-bold text-foreground">
                      Nama Toko / Judul Katalog
                    </Label>
                    <Input
                      id="store-name"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-10 rounded-xl font-bold text-xs"
                      placeholder="RIO COLLECTION"
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
                      className="h-10 rounded-xl text-xs font-mono"
                      placeholder="628123456789"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label
                      htmlFor="contact-email"
                      className="text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Kontak Resmi
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="hello@riocollection.id"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Ekspedisi & Kurir Pengiriman */}
            {activeTab === 'couriers' && (
              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-border/20 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Aktifkan Opsi Ekspedisi / Kurir Pengiriman
                    </h3>
                    <p className="text-xs text-muted-foreground pt-1">
                      Pilih kurir yang ingin diaktifkan di toko Anda. Seluruh data ongkir tersimpan
                      permanen di Database PostgreSQL toko Anda untuk menjamin respons 0ms tanpa
                      batasan rate-limit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingDb}
                    onClick={async () => {
                      setIsSyncingDb(true);
                      try {
                        const res = await axios.post('/api/v1/shipping/sync');
                        if (res.data.code === 200) {
                          toast.success(
                            res.data.message || 'Berhasil sinkronisasi database ongkir!'
                          );
                        }
                      } catch {
                        toast.error('Gagal memproses sinkronisasi database ongkir');
                      } finally {
                        setIsSyncingDb(false);
                      }
                    }}
                    className="h-9 px-3 text-xs font-semibold rounded-xl border-border/60 hover:bg-muted gap-2 shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    {isSyncingDb ? 'Menyingkronkan...' : 'Sync Database Ongkir'}
                  </Button>
                </div>

                {/* Store Origin Location Card */}
                <div className="bg-muted/40 border border-border/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        Lokasi Asal Pengiriman Toko (Origin)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      ID Kota Asal: {originCityId} ({originCityName}, {originProvinceName})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Provinsi Asal Toko
                      </Label>
                      <DashboardSearchableSelect
                        value={originProvinceName}
                        onValueChange={(val: string) => {
                          setOriginProvinceName(val);
                          const cities = INDONESIA_MASTER_LOCATIONS[val] || [];
                          if (cities.length > 0) {
                            setOriginCityName(cities[0].name);
                            setOriginCityId(cities[0].defaultId);
                          }
                        }}
                        options={Object.keys(INDONESIA_MASTER_LOCATIONS).map((p) => ({
                          label: p,
                          value: p
                        }))}
                        placeholder="Pilih Provinsi Asal Toko"
                        searchPlaceholder="Cari provinsi asal toko..."
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Kota / Kabupaten Asal Toko
                      </Label>
                      <DashboardSearchableSelect
                        value={originCityName}
                        onValueChange={(val: string) => {
                          const cities = INDONESIA_MASTER_LOCATIONS[originProvinceName] || [];
                          const matched = cities.find(
                            (c: { name: string; defaultId: string }) => c.name.toLowerCase() === val.toLowerCase()
                          );
                          setOriginCityName(val);
                          if (matched) {
                            setOriginCityId(matched.defaultId);
                          }
                        }}
                        options={(INDONESIA_MASTER_LOCATIONS[originProvinceName] || []).map(
                          (c: { type: string; name: string }) => ({
                            label: `${c.type} ${c.name}`,
                            value: c.name
                          })
                        )}
                        placeholder="Pilih Kota Asal Toko"
                        searchPlaceholder="Cari kota asal toko..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {ALL_COURIERS_LIST.map((courier) => {
                    const isChecked = enabledCouriers
                      .split(',')
                      .map((c) => c.trim().toLowerCase())
                      .includes(courier.code);

                    return (
                      <div
                        key={courier.code}
                        onClick={() => toggleCourier(courier.code)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                          isChecked
                            ? 'bg-primary/5 border-primary/40 shadow-xs'
                            : 'bg-muted/30 border-border/40 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground uppercase tracking-wide">
                              {courier.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-muted text-muted-foreground font-semibold">
                              {courier.code.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{courier.desc}</p>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded-md text-primary border-border focus:ring-primary cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Rekening Pembayaran Toko */}
            {activeTab === 'payments' && <StoreBanksManager />}

            {/* TAB 3: Media Sosial */}
            {activeTab === 'socials' && (
              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-border/20 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Tautan Media Sosial Toko
                  </h3>
                </div>

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
                      placeholder="https://instagram.com/riocollection"
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
                      placeholder="https://tiktok.com/@riocollection"
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
                      placeholder="https://pinterest.com/riocollection"
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
                      placeholder="https://facebook.com/riocollection"
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
                      placeholder="https://x.com/riocollection"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Hero Banner CMS */}
            {activeTab === 'hero' && (
              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-border/20 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    Banner Hero Katalog Depan (CMS)
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hero-title" className="text-xs font-bold text-foreground">
                        Judul Hero Utama
                      </Label>
                      <Input
                        id="hero-title"
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="h-10 rounded-xl font-extrabold text-xs"
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
                        className="h-10 rounded-xl text-xs"
                        placeholder="ARCHIVAL COTTON SILHOUETTE"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hero-cta-text" className="text-xs font-bold text-foreground">
                        Teks Tombol CTA
                      </Label>
                      <Input
                        id="hero-cta-text"
                        type="text"
                        value={heroCtaText}
                        onChange={(e) => setHeroCtaText(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                        placeholder="Eksplor Koleksi Terkini"
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
                        className="h-10 rounded-xl text-xs font-mono"
                        placeholder="/catalogue"
                      />
                    </div>
                  </div>

                  {/* Hero Layout Mode Selector */}
                  <div className="space-y-2 pt-1 pb-2">
                    <Label className="text-xs font-bold text-foreground block">
                      Pilihan Tata Letak Banner (Layout Mode)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setHeroLayout('single')}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
                          heroLayout === 'single'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/60 hover:border-border bg-card'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            1 Kolom (Full Banner)
                          </span>
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              heroLayout === 'single' ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        </div>
                        <div className="h-12 w-full rounded-md border border-dashed border-border/80 bg-muted/30 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            16:9 Full
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          1 gambar membentang selebar layar. Cocok untuk poster komplit.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeroLayout('2-grid')}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
                          heroLayout === '2-grid'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/60 hover:border-border bg-card'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            2 Kolom (Split Grid)
                          </span>
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              heroLayout === '2-grid' ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        </div>
                        <div className="h-12 w-full grid grid-cols-2 gap-1">
                          <div className="rounded border border-dashed border-border/80 bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                            Kiri
                          </div>
                          <div className="rounded border border-dashed border-border/80 bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                            Kanan
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          2 foto berdampingan (3:4). Model &amp; Tekstur/Detail.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeroLayout('3-grid')}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
                          heroLayout === '3-grid'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/60 hover:border-border bg-card'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            3 Kolom (Trio Grid)
                          </span>
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              heroLayout === '3-grid' ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        </div>
                        <div className="h-12 w-full grid grid-cols-3 gap-1">
                          <div className="rounded border border-dashed border-border/80 bg-muted/30 flex items-center justify-center text-[9px] text-muted-foreground font-mono">
                            1
                          </div>
                          <div className="rounded border border-dashed border-border/80 bg-muted/30 flex items-center justify-center text-[9px] text-muted-foreground font-mono">
                            2
                          </div>
                          <div className="rounded border border-dashed border-border/80 bg-muted/30 flex items-center justify-center text-[9px] text-muted-foreground font-mono">
                            3
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          3 foto sejajar (3:4). Menampilkan variasi lengkap.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Image Upload Inputs based on chosen layout */}
                  {heroLayout === 'single' && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto Banner Utama (16:9 / Landscape Full)
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Rekomendasi rasio 16:9 atau banner lebar
                        </span>
                      </div>
                      <ImageUpload
                        value={heroLeftImage}
                        onChange={setHeroLeftImage}
                        aspectRatio="16:9"
                        placeholder="Upload foto banner utama full-width (16:9)"
                        helperText="Banner ini akan tampil memenuhi seluruh bagian hero depan katalog."
                      />
                    </div>
                  )}

                  {heroLayout === '2-grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto Banner Kiri (3:4)
                        </Label>
                        <ImageUpload
                          value={heroLeftImage}
                          onChange={setHeroLeftImage}
                          aspectRatio="3:4"
                          placeholder="Upload foto sisi kiri 3:4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto Banner Kanan (3:4)
                        </Label>
                        <ImageUpload
                          value={heroRightImage}
                          onChange={setHeroRightImage}
                          aspectRatio="3:4"
                          placeholder="Upload foto sisi kanan 3:4"
                        />
                      </div>
                    </div>
                  )}

                  {heroLayout === '3-grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto 1 - Kiri (3:4)
                        </Label>
                        <ImageUpload
                          value={heroLeftImage}
                          onChange={setHeroLeftImage}
                          aspectRatio="3:4"
                          placeholder="Upload foto kiri 3:4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto 2 - Tengah (3:4)
                        </Label>
                        <ImageUpload
                          value={heroCenterImage}
                          onChange={setHeroCenterImage}
                          aspectRatio="3:4"
                          placeholder="Upload foto tengah 3:4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground block">
                          Foto 3 - Kanan (3:4)
                        </Label>
                        <ImageUpload
                          value={heroRightImage}
                          onChange={setHeroRightImage}
                          aspectRatio="3:4"
                          placeholder="Upload foto kanan 3:4"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-xl">
                    💡 <strong>Tips:</strong> Jika foto banner Anda sudah memiliki teks/tipografi
                    sendiri (misalnya mockup baju dengan teks cetak), Anda dapat mengosongkan{' '}
                    <em>Judul Hero</em> dan <em>Sub-judul</em> di atas agar tidak menimpa gambar.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: Homepage CMS */}
            {activeTab === 'homepage' && (
              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-border/20 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Homepage — Judul Section, Manifesto &amp; Banner CTA (CMS)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="home-featured-title">Judul Koleksi Terkini</Label>
                    <Input
                      id="home-featured-title"
                      value={homeFeaturedTitle}
                      onChange={(e) => setHomeFeaturedTitle(e.target.value)}
                      placeholder="Koleksi Terkini"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="home-view-all-label">Teks Lihat Semua</Label>
                    <Input
                      id="home-view-all-label"
                      value={homeViewAllLabel}
                      onChange={(e) => setHomeViewAllLabel(e.target.value)}
                      placeholder="Lihat Semua"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Judul Manifesto</Label>
                    <Input
                      value={homeManifestoTitle}
                      onChange={(e) => setHomeManifestoTitle(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="Mendefinisikan Ulang Esensi."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Gambar Manifesto</Label>
                    <ImageUpload
                      value={homeManifestoImage}
                      onChange={setHomeManifestoImage}
                      aspectRatio="4:5"
                      placeholder="Upload gambar manifesto 4:5"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-foreground">Teks Manifesto</Label>
                    <Textarea
                      value={homeManifestoText}
                      onChange={(e) => setHomeManifestoText(e.target.value)}
                      className="min-h-20 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Teks Banner CTA</Label>
                    <Input
                      value={homeBannerText}
                      onChange={(e) => setHomeBannerText(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="Setiap edisi adalah eksplorasi mandiri..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Teks Tombol Banner CTA
                    </Label>
                    <Input
                      value={homeBannerButton}
                      onChange={(e) => setHomeBannerButton(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                      placeholder="Eksplor Koleksi Terkini"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Archive & About CMS */}
            {activeTab === 'pages' && (
              <div className="space-y-6">
                {/* Archive Section */}
                <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/20 pb-3">
                    Konten Halaman Archive (CMS)
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Sub-judul Archive</Label>
                      <Input
                        value={archiveHeaderSub}
                        onChange={(e) => setArchiveHeaderSub(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                        placeholder="Previous designs and past drops."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Judul Quote Archive
                      </Label>
                      <Input
                        value={archiveQuoteTitle}
                        onChange={(e) => setArchiveQuoteTitle(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                        placeholder="Merekam jejak perjalanan estetika kami."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Teks Quote Archive
                      </Label>
                      <Textarea
                        value={archiveQuoteText}
                        onChange={(e) => setArchiveQuoteText(e.target.value)}
                        className="min-h-20 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/20 pb-3">
                    Konten Halaman About Us (CMS)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Gambar Hero About</Label>
                      <ImageUpload
                        value={aboutHeroImage}
                        onChange={setAboutHeroImage}
                        aspectRatio="16:9"
                        placeholder="Upload cover banner about 16:9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Judul Utama / Heading
                      </Label>
                      <Input
                        value={aboutHeading}
                        onChange={(e) => setAboutHeading(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                        placeholder="Independent. Archival. Uncompromising."
                      />
                      <Label className="text-xs font-bold text-foreground block pt-3">
                        Judul Section Nilai
                      </Label>
                      <Input
                        value={aboutValuesTitle}
                        onChange={(e) => setAboutValuesTitle(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                        placeholder="Nilai Kami"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Paragraf Pertama</Label>
                    <Textarea
                      value={aboutParagraph1}
                      onChange={(e) => setAboutParagraph1(e.target.value)}
                      className="min-h-20 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Paragraf Kedua</Label>
                    <Textarea
                      value={aboutParagraph2}
                      onChange={(e) => setAboutParagraph2(e.target.value)}
                      className="min-h-20 rounded-xl text-xs"
                    />
                  </div>

                  {/* Brand Values */}
                  <div className="space-y-3 pt-2 border-t border-border/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">
                        Nilai-Nilai Brand (Values)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-3 rounded-lg text-xs"
                        onClick={() =>
                          setAboutValues((v) => [...v, { title: '', description: '' }])
                        }
                      >
                        + Tambah Nilai
                      </Button>
                    </div>

                    {aboutValues.map((val, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-start p-3 border border-border/20 rounded-xl"
                      >
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">
                            Judul Nilai
                          </Label>
                          <Input
                            value={val.title}
                            onChange={(e) =>
                              setAboutValues((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, title: e.target.value } : item
                                )
                              )
                            }
                            className="h-9 rounded-lg text-xs"
                            placeholder="Slow Design"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">
                            Deskripsi Nilai
                          </Label>
                          <Textarea
                            value={val.description}
                            onChange={(e) =>
                              setAboutValues((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, description: e.target.value } : item
                                )
                              )
                            }
                            className="min-h-16 rounded-xl text-xs"
                            placeholder="Deskripsi nilai brand..."
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-lg text-xs text-destructive border-destructive/30 self-center mt-4"
                          onClick={() => setAboutValues((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Quote + Studio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Quote About</Label>
                      <Input
                        value={aboutQuote}
                        onChange={(e) => setAboutQuote(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Teks di Bawah Quote
                      </Label>
                      <Input
                        value={aboutQuoteText}
                        onChange={(e) => setAboutQuoteText(e.target.value)}
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-bold text-foreground">Gambar Studio</Label>
                    <ImageUpload
                      value={aboutStudioImage}
                      onChange={setAboutStudioImage}
                      aspectRatio="4:5"
                      placeholder="Upload foto studio 4:5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Floating / Sticky Save Action Button on Mobile & Desktop */}
            {activeTab !== 'payments' && (
              <div className="sticky bottom-3 sm:static z-30 pt-3 flex justify-end">
                <div className="w-full sm:w-auto p-2 sm:p-0 bg-background/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border sm:border-0 border-border/60 rounded-2xl shadow-lg sm:shadow-none">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto gap-2 h-11 px-8 rounded-xl cursor-pointer font-extrabold uppercase tracking-wider text-xs shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </VStack>
  );
}
