'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Shirt, Layers, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RupiahInput } from '@/components/ui/rupiah-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { ImageUpload, MultiImageUpload } from '@/components/shared/image-upload';
import { ReleaseScheduleField } from '@/components/dashboard/release-schedule-field';
import { useProducts } from '@/hooks/use-products';
import { useJournals } from '@/hooks/use-journals';
import {
  useCategoriesQuery,
  useColorsQuery,
  useSizesQuery,
  useMaterialsQuery
} from '@/hooks/use-master-data';
import { sortSizes } from '@/lib/size-sorter';
import type {
  Product,
  ProductMutationInput,
  ProductStatus,
  StockMode
} from '@/types/catalogue.types';

interface ProductFormProps {
  initialProduct?: Product;
}

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct;
  const { createProduct, updateProduct, isCreating, isUpdating } = useProducts();
  const isSaving = isCreating || isUpdating;
  const { data: journals = [], isLoading: loadingJournals } = useJournals();

  // Master Data from DB
  const { data: categories = [] } = useCategoriesQuery();
  const { data: colors = [] } = useColorsQuery();
  const { data: sizes = [] } = useSizesQuery();
  const { data: masterMaterials = [] } = useMaterialsQuery();
  const activeSizes = sizes.filter((s) => s.isActive);

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [price, setPrice] = useState(initialProduct?.price || 0);
  const [hpp, setHpp] = useState(initialProduct?.hpp || 0);
  const [colorsSelected, setColorsSelected] = useState<string[]>(
    initialProduct?.colors?.length
      ? initialProduct.colors
      : initialProduct?.color
        ? [initialProduct.color]
        : []
  );
  const [colorHex] = useState(initialProduct?.colorHex || '#1A1A1A');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status || 'AVAILABLE');

  const [releaseDate, setReleaseDate] = useState<string | null>(
    initialProduct?.releaseDate ?? null
  );
  const [preOrderEstimate, setPreOrderEstimate] = useState(initialProduct?.preOrderEstimate || '');
  const [stockMode, setStockMode] = useState<StockMode>(initialProduct?.stockMode || 'QUANTITY');
  const orderLimitMode = initialProduct?.orderLimitMode || 'UNLIMITED';
  const [edition, setEdition] = useState(initialProduct?.edition || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [imagesList, setImagesList] = useState<string[]>(initialProduct?.images || []);
  const [journalIds, setJournalIds] = useState<string[]>(
    initialProduct?.journalIds ?? initialProduct?.journals?.map((journal) => journal.id) ?? []
  );

  // Materials & Care State
  const [fabric, setFabric] = useState(initialProduct?.materialsAndCare?.fabric || '');
  const [treatment, setTreatment] = useState(initialProduct?.materialsAndCare?.treatment || '');
  const [origin, setOrigin] = useState(initialProduct?.materialsAndCare?.origin || '');
  const [careInstruction, setCareInstruction] = useState(
    initialProduct?.materialsAndCare?.careInstruction || ''
  );

  const getSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama Kaos wajib diisi');
      return;
    }
    if (!imageUrl) {
      toast.error('Foto Utama Kaos wajib diunggah');
      return;
    }

    if (status === 'COMING_SOON') {
      if (!releaseDate || new Date(releaseDate).getTime() <= Date.now()) {
        toast.error('Produk Coming Soon wajib memiliki tanggal rilis di masa depan');
        return;
      }
    }

    const slug = getSlug(name);
    const sortedActiveSizes = sortSizes(activeSizes, (s) => s.size);
    const variants = isEditing
      ? initialProduct.variants
      : sortedActiveSizes.map((s) => ({
          size: s.size,
          inStock: stockMode === 'ALWAYS_AVAILABLE',
          stock: stockMode === 'ALWAYS_AVAILABLE' ? 999 : 0
        }));

    const computedTotalStock = isEditing
      ? (initialProduct.stock ??
        initialProduct.variants.reduce((acc, v) => acc + (v.stock || 0), 0))
      : stockMode === 'ALWAYS_AVAILABLE'
        ? 9999
        : 0;

    let finalStatus: ProductStatus = status;
    if (stockMode === 'ALWAYS_AVAILABLE') {
      if (!['SOLD_OUT', 'DISCONTINUED', 'COMING_SOON', 'PRE_ORDER'].includes(status)) {
        finalStatus = 'AVAILABLE';
      }
    } else {
      if (computedTotalStock === 0 && status === 'AVAILABLE' && !isEditing) {
        finalStatus = 'AVAILABLE';
      }
    }

    const primaryColorHex =
      colors.find((c) => c.name.toLowerCase() === (colorsSelected[0] || '').toLowerCase())?.hex ||
      colorHex;
    const allColorHexes = colorsSelected.map(
      (cName) => colors.find((c) => c.name.toLowerCase() === cName.toLowerCase())?.hex || colorHex
    );

    const payload: ProductMutationInput = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      name,
      slug,
      price,
      hpp,
      color: colorsSelected[0] || 'Black',
      colorHex: primaryColorHex,
      colors: colorsSelected.length ? colorsSelected : ['Black'],
      colorHexes: allColorHexes.length ? allColorHexes : [primaryColorHex],
      category: category || (categories[0]?.name ?? 'Boxy Tee'),
      status: finalStatus,
      releaseDate,
      preOrderEstimate: finalStatus === 'PRE_ORDER' ? preOrderEstimate.trim() || null : null,
      stockMode,
      orderLimitMode,
      maxPurchaseLimit: orderLimitMode === 'ONCE_PER_USER' ? 1 : null,
      edition: edition || 'Edition 001',
      description,
      imageUrl,
      images: imagesList.length ? imagesList : [imageUrl],
      imageDetails: imagesList.map((url, i) => ({
        id: `img-${i}`,
        url,
        caption: `Angle ${i + 1}`,
        isDetail: true,
        displayOrder: i + 1
      })),
      materialsAndCare: {
        fabric: fabric || '',
        treatment: treatment || '',
        origin: origin || '',
        careInstruction: careInstruction || ''
      },
      journalIds,
      variants,
      stock: computedTotalStock
    };

    try {
      if (isEditing) {
        await updateProduct(payload);
        toast.success(`Detail produk "${payload.name}" berhasil diperbarui`);
      } else {
        await createProduct(payload);
        toast.success(
          `Produk "${payload.name}" berhasil ditambahkan! Silakan atur kuantitas stok di Manajemen Stok.`
        );
      }
      router.push('/dashboard/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error('Gagal menyimpan produk');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl cursor-pointer"
              title="Kembali ke Daftar Produk"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              <span>
                {isEditing
                  ? `Edit: ${initialProduct.name}`
                  : 'Tambah Model Kaos & Spesifikasi Baru'}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground pt-0.5">
              Atur informasi dasar kaos, harga HPP, mode stok, galeri foto, serta Materials & Care
              instruction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link href="/dashboard/products">
            <Button variant="outline" className="h-10 rounded-xl text-xs font-bold cursor-pointer">
              Batal
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 gap-2 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Specifications - 7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Basic Info */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Shirt className="h-4 w-4 text-primary" />
              <span>Informasi Produk Dasar</span>
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="prod-name" className="text-xs font-bold text-foreground">
                Nama Kaos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Heavy-Weight Boxy Tee — Culture Series"
                className="h-10 rounded-xl text-xs font-bold"
                required
              />
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Harga Jual (IDR)</Label>
                <RupiahInput
                  value={price}
                  onValueChange={setPrice}
                  placeholder="0"
                  className="h-10 text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">HPP / Modal (IDR)</Label>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold text-muted-foreground uppercase"
                  >
                    Privat
                  </Badge>
                </div>
                <RupiahInput
                  value={hpp}
                  onValueChange={setHpp}
                  placeholder="0"
                  className="h-10 text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Select Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Edisi / Drop Kaos</Label>
                <Input
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="Misal: Edition 001, Drop 02, dsb."
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Kategori Produk</Label>
                <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Warna Kaos</Label>
                <MultiSelect
                  value={colorsSelected}
                  onChange={setColorsSelected}
                  options={colors.map((col) => ({
                    value: col.name,
                    label: col.name
                  }))}
                  placeholder="Pilih satu atau beberapa warna"
                  searchPlaceholder="Cari warna..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Status Availability Produk
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    const nextStatus = val as ProductStatus;
                    setStatus(nextStatus);
                    if (nextStatus !== 'COMING_SOON') setReleaseDate(null);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Status Produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available (Ready)</SelectItem>
                    <SelectItem value="PRE_ORDER">Pre-Order</SelectItem>
                    <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                    <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {status === 'COMING_SOON' && (
              <ReleaseScheduleField
                value={releaseDate}
                onChange={setReleaseDate}
                stockMode={stockMode}
                onStockModeChange={setStockMode}
              />
            )}

            {status === 'PRE_ORDER' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label htmlFor="pre-order-estimate" className="text-xs font-bold text-foreground">
                  Estimasi Waktu Pre-Order
                </Label>
                <Select
                  value={preOrderEstimate || '7–14 hari kerja'}
                  onValueChange={(val) => setPreOrderEstimate(val ?? '')}
                >
                  <SelectTrigger id="pre-order-estimate" className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Estimasi Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3–5 hari kerja">3–5 Hari Kerja (Cepat)</SelectItem>
                    <SelectItem value="5–7 hari kerja">5–7 Hari Kerja (~1 Minggu)</SelectItem>
                    <SelectItem value="7–14 hari kerja">
                      7–14 Hari Kerja (Standar / Default)
                    </SelectItem>
                    <SelectItem value="14–21 hari kerja">14–21 Hari Kerja (2–3 Minggu)</SelectItem>
                    <SelectItem value="30 hari kerja">30 Hari Kerja (~1 Bulan)</SelectItem>
                    {![
                      '3–5 hari kerja',
                      '5–7 hari kerja',
                      '7–14 hari kerja',
                      '14–21 hari kerja',
                      '30 hari kerja'
                    ].includes(preOrderEstimate) &&
                      preOrderEstimate && (
                        <SelectItem value={preOrderEstimate}>{preOrderEstimate}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Pilih estimasi waktu produksi & pengiriman untuk produk Pre-Order ini.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Deskripsi Produk</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail bahan, sizing, fitting, dan visual sablon kaos..."
                className="min-h-24 rounded-xl text-xs"
              />
            </div>

            {/* Related Blog Articles */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Blog Terkait (Opsional)</Label>
              <MultiSelect
                value={journalIds}
                onChange={setJournalIds}
                options={journals.map((j) => ({
                  value: j.id,
                  label: j.title,
                  description: `${j.category} · ${j.date}`
                }))}
                placeholder={
                  loadingJournals ? 'Memuat artikel blog...' : 'Pilih artikel blog terkait'
                }
                searchPlaceholder="Cari artikel blog..."
                maxCount={2}
                disabled={loadingJournals}
              />
            </div>
          </div>

          {/* Section 2: Materials & Care Specifications */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Spesifikasi Bahan & Perawatan (Materials & Care)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Pilih bahan dan origin dari master data, lalu isi treatment dan instruksi perawatan
              secara bebas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Fabric / Material Bahan</Label>
                <Select value={fabric} onValueChange={(val) => val && setFabric(val)}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Fabric / Material Bahan" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterMaterials
                      .filter((m) => m.type === 'FABRIC' && m.isActive)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    {fabric &&
                      !masterMaterials.some((m) => m.type === 'FABRIC' && m.name === fabric) && (
                        <SelectItem value={fabric}>{fabric}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Origin / Negara Asal</Label>
                <Select value={origin} onValueChange={(val) => val && setOrigin(val)}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Pilih Origin / Negara Asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterMaterials
                      .filter((m) => m.type === 'ORIGIN' && m.isActive)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    {origin &&
                      !masterMaterials.some((m) => m.type === 'ORIGIN' && m.name === origin) && (
                        <SelectItem value={origin}>{origin}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-foreground">Treatment Bahan</Label>
                <Input
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Misal: Bio-Washed, Vintage Wash, Anti-Shrink..."
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-foreground">Care Instruction</Label>
                <Textarea
                  value={careInstruction}
                  onChange={(e) => setCareInstruction(e.target.value)}
                  placeholder="Misal: Machine wash cold inside out. Do not tumble dry. Cool iron on reverse."
                  className="min-h-20 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Media & Variant Stock Controls - 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 3: Main & Detail Photo Uploads */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>Galeri Foto Produk</span>
            </h3>

            {/* Foto Utama */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Foto Utama (Katalog Aspect 3:4) <span className="text-red-500">*</span>
              </Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Upload Foto Utama Produk Kaos"
                aspectRatio="3:4"
              />
            </div>

            {/* Foto Detail Multi-Image Upload */}
            <div className="space-y-2 pt-2 border-t border-border/20">
              <Label className="text-xs font-bold text-foreground">
                Foto Detail / Angles Lainnya (Aspect 1:1)
              </Label>
              <MultiImageUpload
                value={imagesList}
                onChange={setImagesList}
                maxImages={99}
                slotLabels={imagesList.map((_, i) => `Detail ${i + 1}`)}
                aspectRatio="1:1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
