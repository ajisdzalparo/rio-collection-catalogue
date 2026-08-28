'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus,
  Tag,
  Edit,
  Layers,
  Check,
  Trash2,
  Image as ImageIcon,
  Eye,
  Pencil,
  Package,
  Boxes,
  Infinity as InfinityIcon,
  Shirt
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/use-products';
import { useMasterStore } from '@/hooks/use-master-data';
import { Flex, VStack } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { ImageUpload, MultiImageUpload } from '@/components/shared/image-upload';
import { cn, formatIDR } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Product, ProductVariant, ProductStatus, StockMode } from '@/types/catalogue.types';

export default function ProductsCmsPage() {
  const {
    data: products = [],
    isLoading: loading,
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting
  } = useProducts();

  // Master data
  const { categories, colors, sizes, editions } = useMasterStore();
  const activeSizes = sizes.filter((s) => s.isActive);

  // Search & Filters
  const [searchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset active image index during render when detail product changes
  const [prevDetailProduct, setPrevDetailProduct] = useState<Product | null>(null);
  if (detailProduct !== prevDetailProduct) {
    setPrevDetailProduct(detailProduct);
    setActiveImageIndex(0);
  }

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [hpp, setHpp] = useState(180000);
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#1A1A1A');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<ProductStatus>('AVAILABLE');
  const [stockMode, setStockMode] = useState<StockMode>('QUANTITY');
  const [edition, setEdition] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);

  // Materials & Care Form States
  const [fabric, setFabric] = useState('100% Premium Heavyweight Cotton, 280gsm');
  const [treatment, setTreatment] = useState('Pre-shrunk to minimize shrinkage');
  const [origin, setOrigin] = useState('Constructed in Indonesia');
  const [careInstruction, setCareInstruction] = useState('Machine wash cold inside out. Do not tumble dry. Cool iron on reverse.');

  // Stock state per size variant: { size: { inStock: boolean, stock: number } }
  const [sizesStock, setSizesStock] = useState<Record<string, { inStock: boolean; stock: number }>>({});

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setPrice(450000);
    setHpp(180000);
    setColor(colors[0]?.name || '');
    setColorHex(colors[0]?.hex || '#1A1A1A');
    setCategory(categories[0]?.slug || '');
    setStatus('AVAILABLE');
    setStockMode('QUANTITY');
    setEdition(editions[0]?.name || 'Edition 001');
    setDescription('');
    setImageUrl('/images/products/black-tee.jpg');
    setImagesList(['/images/products/black-tee.jpg']);

    setFabric('100% Premium Heavyweight Cotton, 280gsm');
    setTreatment('Pre-shrunk to minimize shrinkage');
    setOrigin('Constructed in Indonesia');
    setCareInstruction('Machine wash cold inside out. Do not tumble dry. Cool iron on reverse.');

    // Build default sizes stock map from active sizes
    const defaultSizes: Record<string, { inStock: boolean; stock: number }> = {};
    activeSizes.forEach((s) => {
      defaultSizes[s.size] = { inStock: true, stock: 10 };
    });
    setSizesStock(defaultSizes);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = useCallback(
    (product: Product) => {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price);
      setHpp(product.hpp || 180000);
      setColor(product.color);
      setColorHex(product.colorHex);
      setCategory(product.category);
      setStatus(product.status);
      setStockMode(product.stockMode || 'QUANTITY');
      setEdition(product.edition);
      setDescription(product.description);
      setImageUrl(product.imageUrl);
      setImagesList(product.images || [product.imageUrl]);

      setFabric(product.materialsAndCare?.fabric || '100% Premium Heavyweight Cotton, 280gsm');
      setTreatment(product.materialsAndCare?.treatment || 'Pre-shrunk to minimize shrinkage');
      setOrigin(product.materialsAndCare?.origin || 'Constructed in Indonesia');
      setCareInstruction(product.materialsAndCare?.careInstruction || 'Machine wash cold inside out. Do not tumble dry. Cool iron on reverse.');

      // Map variants back to sizing stock state
      const stockMap: Record<string, { inStock: boolean; stock: number }> = {};
      activeSizes.forEach((s) => {
        stockMap[s.size] = { inStock: false, stock: 0 };
      });
      product.variants.forEach((v) => {
        const qty = v.stock ?? (v.inStock ? 10 : 0);
        stockMap[v.size] = {
          inStock: v.inStock || qty > 0,
          stock: qty
        };
      });
      setSizesStock(stockMap);
      setIsDialogOpen(true);
    },
    [activeSizes]
  );

  // Auto-generate slug from name
  const getSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Total calculated stock from form sizes
  const totalFormStock = useMemo(() => {
    if (stockMode === 'ALWAYS_AVAILABLE') return 9999;
    return Object.values(sizesStock).reduce((sum, item) => sum + (item.inStock ? item.stock : 0), 0);
  }, [sizesStock, stockMode]);

  const handleSaveProduct = async () => {
    const slug = getSlug(name);

    const variants: ProductVariant[] = Object.entries(sizesStock).map(([size, item]) => ({
      size,
      inStock: stockMode === 'ALWAYS_AVAILABLE' ? true : (item.inStock && item.stock > 0),
      stock: stockMode === 'ALWAYS_AVAILABLE' ? 999 : (item.inStock ? item.stock : 0)
    }));

    const computedTotalStock = stockMode === 'ALWAYS_AVAILABLE' ? 9999 : variants.reduce((acc, v) => acc + (v.stock || 0), 0);

    let finalStatus: ProductStatus = status;
    if (stockMode === 'ALWAYS_AVAILABLE') {
      if (status !== 'SOLD_OUT' && status !== 'COMING_SOON') {
        finalStatus = 'AVAILABLE';
      }
    } else {
      if (computedTotalStock === 0 && status === 'AVAILABLE') {
        finalStatus = 'SOLD_OUT';
      }
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Math.floor(Math.random() * 1000)}`,
      name,
      slug,
      price,
      hpp,
      stock: computedTotalStock,
      stockMode,
      color,
      colorHex,
      category,
      status: finalStatus,
      edition,
      description,
      imageUrl,
      images: imagesList,
      variants,
      materialsAndCare: {
        fabric,
        treatment,
        origin,
        careInstruction
      }
    };

    try {
      if (editingProduct) {
        await updateProduct(payload);
        toast.success(`Produk ${name} berhasil diperbarui`);
      } else {
        await createProduct(payload);
        toast.success(`Produk ${name} berhasil ditambahkan`);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error('Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      if (confirm('Apakah Anda yakin ingin menghapus produk ini dari CMS?')) {
        try {
          await deleteProduct(productId);
          toast.success('Produk berhasil dihapus');
        } catch (err) {
          console.error('Failed to delete product:', err);
          toast.error('Gagal menghapus produk');
        }
      }
    },
    [deleteProduct]
  );

  const getStatusBadge = (product: Product) => {
    const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
    const isOutOfStock = !isAlwaysAvailable && (product.stock === 0 || product.status === 'SOLD_OUT');

    if (isOutOfStock) {
      return <Badge variant="destructive">Sold Out (Stok 0)</Badge>;
    }

    switch (product.status) {
      case 'AVAILABLE':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            {isAlwaysAvailable ? 'Available (Selalu Ready)' : 'Available (Ready Stock)'}
          </Badge>
        );
      case 'COMING_SOON':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Coming Soon / Pre-Order
          </Badge>
        );
      case 'SOLD_OUT':
        return <Badge variant="destructive">Sold Out</Badge>;
      default:
        return <Badge variant="outline">{product.status}</Badge>;
    }
  };

  const toggleSizeStock = (size: string) => {
    setSizesStock((prev) => {
      const curr = prev[size] || { inStock: false, stock: 0 };
      const nextInStock = !curr.inStock;
      return {
        ...prev,
        [size]: {
          inStock: nextInStock,
          stock: nextInStock ? (curr.stock > 0 ? curr.stock : 10) : 0
        }
      };
    });
  };

  const updateSizeStockQty = (size: string, qty: number) => {
    const validQty = Math.max(0, qty);
    setSizesStock((prev) => ({
      ...prev,
      [size]: {
        inStock: validQty > 0,
        stock: validQty
      }
    }));
  };

  // Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.edition.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Table Columns Definition for DataTable
  const columns: Column<Product>[] = useMemo(
    () => [
      {
        header: 'Foto',
        cell: (product) => (
          <div className="relative h-12 w-10 overflow-hidden bg-muted/50 border border-border/20 rounded-md shrink-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        )
      },
      {
        header: 'Nama Kaos',
        accessorKey: 'name',
        sortable: true,
        className: 'w-full min-w-[180px]',
        cell: (product) => (
          <div className="flex flex-col text-xs">
            <span className="font-bold text-foreground">{product.name}</span>
            <span className="text-[10px] text-muted-foreground">{product.color}</span>
          </div>
        )
      },
      {
        header: 'Kategori & Edisi',
        accessorKey: 'category',
        sortable: true,
        cell: (product) => (
          <div className="space-y-1 text-xs">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
              <Layers className="h-3 w-3 shrink-0" />
              <span className="capitalize">{product.category.replace('-', ' ')}</span>
            </span>
            <div className="text-[10px] text-muted-foreground font-medium">{product.edition}</div>
          </div>
        )
      },
      {
        header: 'Harga & HPP',
        accessorKey: 'price',
        sortable: true,
        className: 'font-bold text-xs',
        cell: (product) => (
          <div className="flex flex-col text-xs">
            <span className="font-extrabold text-foreground">{formatIDR(product.price)}</span>
            <div className="flex items-center gap-1 text-[10px] mt-0.5">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                HPP: {formatIDR(product.hpp || 180000)}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                (+{formatIDR(product.price - (product.hpp || 180000))})
              </span>
            </div>
          </div>
        )
      },
      {
        header: 'Total Stok',
        accessorKey: 'stock',
        sortable: true,
        cell: (product) => {
          if (product.stockMode === 'ALWAYS_AVAILABLE') {
            return (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-bold gap-1">
                <InfinityIcon className="h-3.5 w-3.5" />
                <span>Tanpa Batas</span>
              </Badge>
            );
          }
          const totalStock = product.stock ?? product.variants.reduce((acc, v) => acc + (v.stock || (v.inStock ? 10 : 0)), 0);
          return (
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Package className={`h-4 w-4 ${totalStock > 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={totalStock > 0 ? 'text-foreground font-black' : 'text-red-500 font-black'}>
                {totalStock} pcs
              </span>
            </div>
          );
        }
      },
      {
        header: 'Stok Per Ukuran',
        className: 'min-w-[220px]',
        cell: (product) => {
          if (product.stockMode === 'ALWAYS_AVAILABLE') {
            return <span className="text-[11px] text-muted-foreground italic">Semua ukuran ready</span>;
          }
          return (
            <div className="flex gap-1.5 flex-wrap">
              {product.variants.map((v) => {
                const qty = v.stock ?? (v.inStock ? 10 : 0);
                return (
                  <div
                    key={v.size}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border rounded-md select-none',
                      qty > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-muted/40 text-muted-foreground border-border/30 line-through opacity-40'
                    )}
                  >
                    <span className="font-mono">{v.size}:</span>
                    <span>{qty}</span>
                  </div>
                );
              })}
            </div>
          );
        }
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (product) => getStatusBadge(product)
      },
      {
        header: 'Aksi',
        className: 'text-right',
        cell: (product) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetailProduct(product)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(product)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Edit Produk & Stok"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteProduct(product.id)}
              disabled={isDeleting}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Hapus Produk"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [handleDeleteProduct, handleOpenEdit, isDeleting]
  );

  return (
    <VStack gap="lg" className="pb-10">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Master Produk & Stok</h1>
          <p className="text-sm text-muted-foreground pt-1">
            Kelola katalog kaos RIO COLLECTION, atur mode ketersediaan, spesifikasi bahan & care instruction, harga, & HPP
          </p>
        </VStack>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 h-10 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kaos Baru</span>
        </Button>
      </Flex>

      {/* Products DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={loading}
        searchKey="name"
        searchPlaceholder="Cari nama kaos, edisi, deskripsi..."
        filterComponents={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Kategori:
            </span>
            <Select
              value={selectedCategory}
              onValueChange={(val) => val && setSelectedCategory(val)}
            >
              <SelectTrigger className="w-45 h-9 rounded-xl">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="Produk Tidak Ditemukan"
        emptyDescription="Tidak ada data katalog kaos yang cocok dengan filter atau pencarian Anda."
        pageSize={10}
      />

      {/* Add / Edit Product Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-7xl bg-card border-border/40 rounded-3xl">
          <DialogHeader className="border-b border-border/20 pb-4">
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span>
                {editingProduct ? `Edit Kaos & Spesifikasi: ${editingProduct.name}` : 'Tambah Model Kaos & Spesifikasi Baru'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Atur informasi dasar kaos, harga HPP, mode ketersediaan stok, galeri foto, serta Materials & Care instruction.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Left Col: Basic Fields & Materials */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-name" className="text-xs font-bold text-foreground">
                  Nama Kaos
                </Label>
                <Input
                  id="prod-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Heavy-Weight Boxy Tee"
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              {/* Mode Manajemen Stok Toggle */}
              <div className="space-y-2 bg-muted/15 p-4 rounded-2xl border border-border/20">
                <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Mode Ketersediaan Stok</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Pilih metode kontrol stok</span>
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Card 1: By Quantity */}
                  <div
                    onClick={() => setStockMode('QUANTITY')}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5',
                      stockMode === 'QUANTITY'
                        ? 'bg-card border-foreground ring-1 ring-foreground shadow-xs'
                        : 'bg-muted/20 border-border/30 hover:border-border/80'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Boxes className="h-4 w-4 text-emerald-500 shrink-0" />
                        Berdasarkan Qty Stok
                      </span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          stockMode === 'QUANTITY' ? 'border-foreground bg-foreground' : 'border-border/60'
                        )}
                      >
                        {stockMode === 'QUANTITY' && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Menghitung stok fisik per size. Otomatis <strong className="text-foreground font-semibold">Sold Out</strong> jika stok 0.
                    </p>
                  </div>

                  {/* Card 2: Always Available */}
                  <div
                    onClick={() => setStockMode('ALWAYS_AVAILABLE')}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5',
                      stockMode === 'ALWAYS_AVAILABLE'
                        ? 'bg-card border-foreground ring-1 ring-foreground shadow-xs'
                        : 'bg-muted/20 border-border/30 hover:border-border/80'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <InfinityIcon className="h-4 w-4 text-blue-500 shrink-0" />
                        Selalu Tersedia
                      </span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          stockMode === 'ALWAYS_AVAILABLE' ? 'border-foreground bg-foreground' : 'border-border/60'
                        )}
                      >
                        {stockMode === 'ALWAYS_AVAILABLE' && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Tanpa batas stok (selalu ready stock / pre-order).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-price" className="text-xs font-bold text-foreground">
                    Harga Jual (IDR)
                  </Label>
                  <Input
                    id="prod-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-10 rounded-xl font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="prod-hpp"
                    className="text-xs font-bold text-foreground flex justify-between items-center"
                  >
                    <span>HPP / Modal (IDR)</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">
                      Privat
                    </span>
                  </Label>
                  <Input
                    id="prod-hpp"
                    type="number"
                    value={hpp}
                    onChange={(e) => setHpp(Number(e.target.value))}
                    className="h-10 rounded-xl font-bold text-amber-600 dark:text-amber-400"
                    placeholder="180000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Edisi / Drop</Label>
                <Select value={edition} onValueChange={(val) => val && setEdition(val)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih Edisi / Drop" />
                  </SelectTrigger>
                  <SelectContent>
                    {editions.map((ed) => (
                      <SelectItem key={ed.id} value={ed.name}>
                        {ed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Warna</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl border border-border/40 shadow-xs shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                  <Select
                    value={color}
                    onValueChange={(val) => {
                      if (!val) return;
                      setColor(val);
                      const found = colors.find((c) => c.name === val);
                      if (found) setColorHex(found.hex);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl grow">
                      <SelectValue placeholder="Pilih Warna" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border/40"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.name}
                            <span className="text-muted-foreground font-mono text-[10px] uppercase">
                              {c.hex}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kategori</Label>
                  <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {stockMode === 'ALWAYS_AVAILABLE' ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Status Availability Produk</Label>
                    <Select
                      value={status}
                      onValueChange={(val) => val && setStatus(val as ProductStatus)}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available (Ready Stock)</SelectItem>
                        <SelectItem value="SOLD_OUT">Sold Out (Habis / Discontinued)</SelectItem>
                        <SelectItem value="COMING_SOON">Coming Soon / Pre-Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Status Availability</Label>
                    <div className="h-10 px-3.5 flex items-center bg-muted/20 border border-border/20 rounded-xl text-xs">
                      {totalFormStock > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Otomatis Available (Stok {totalFormStock} pcs)
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Otomatis Sold Out (Stok 0)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-desc" className="text-xs font-bold text-foreground">
                  Deskripsi Produk
                </Label>
                <Textarea
                  id="prod-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail bahan, sizing, fitting, dan visual sablon kaos..."
                  className="min-h-20 rounded-xl text-xs"
                />
              </div>

              {/* Materials & Care Form Section */}
              <div className="space-y-3 p-4 bg-muted/10 border border-border/20 rounded-2xl">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shirt className="h-4 w-4 text-sky-500 shrink-0" />
                  Spesifikasi Bahan & Perawatan (Materials & Care)
                </Label>
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="mat-fabric" className="text-[11px] font-semibold text-muted-foreground">
                      Fabric / Material Bahan
                    </Label>
                    <Input
                      id="mat-fabric"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="100% Premium Heavyweight Cotton, 280gsm"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mat-treatment" className="text-[11px] font-semibold text-muted-foreground">
                      Treatment Bahan
                    </Label>
                    <Input
                      id="mat-treatment"
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      placeholder="Pre-shrunk to minimize shrinkage"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="mat-origin" className="text-[11px] font-semibold text-muted-foreground">
                        Origin / Negara Asal
                      </Label>
                      <Input
                        id="mat-origin"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Constructed in Indonesia"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mat-care" className="text-[11px] font-semibold text-muted-foreground">
                        Care Instruction
                      </Label>
                      <Input
                        id="mat-care"
                        value={careInstruction}
                        onChange={(e) => setCareInstruction(e.target.value)}
                        placeholder="Machine wash cold inside out..."
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Media and Sizing with Numeric Stock Control */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Foto Utama</Label>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="Pilih atau upload foto kaos utama"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Galeri Foto Produk</Label>
                <MultiImageUpload value={imagesList} onChange={setImagesList} maxImages={6} />
              </div>

              {/* Enhanced Stock Management Per Size */}
              <div className="space-y-3 p-4 bg-muted/10 border border-border/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-emerald-500" />
                    Manajemen Stok Per Ukuran (Size)
                  </Label>
                  {stockMode === 'ALWAYS_AVAILABLE' ? (
                    <Badge variant="secondary" className="font-mono text-xs font-bold bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                      <InfinityIcon className="h-3.5 w-3.5" />
                      <span>Selalu Available</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-mono text-xs font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Total: {totalFormStock} pcs
                    </Badge>
                  )}
                </div>

                {stockMode === 'ALWAYS_AVAILABLE' ? (
                  <p className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/15 p-3 rounded-xl">
                    Mode <strong>Selalu Tersedia</strong> aktif. Produk tidak membatasi jumlah stok dan tidak akan otomatis menjadi Sold Out.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {Object.keys(sizesStock).map((size) => {
                      const item = sizesStock[size] || { inStock: false, stock: 0 };
                      return (
                        <div
                          key={size}
                          className={cn(
                            'flex items-center justify-between p-2.5 border rounded-xl transition-all',
                            item.inStock && item.stock > 0
                              ? 'bg-card border-border/40 shadow-2xs'
                              : 'bg-muted/20 border-border/20 opacity-60'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSizeStock(size)}
                            className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground"
                          >
                            <div
                              className={cn(
                                'h-5 w-5 rounded-md border flex items-center justify-center transition-colors',
                                item.inStock
                                  ? 'bg-foreground text-background border-foreground'
                                  : 'border-border/60 bg-transparent'
                              )}
                            >
                              {item.inStock && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <span>Ukuran {size}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                              Qty:
                            </span>
                            <Input
                              type="number"
                              min={0}
                              disabled={!item.inStock}
                              value={item.stock}
                              onChange={(e) => updateSizeStockQty(size, Number(e.target.value))}
                              className="w-16 h-8 text-center font-mono font-bold text-xs rounded-lg"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/20 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 rounded-xl text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!name || isCreating || isUpdating}
              className="h-10 rounded-xl text-xs cursor-pointer font-bold uppercase tracking-wider"
            >
              {isCreating || isUpdating ? 'Menyimpan...' : 'Simpan Produk & Spesifikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Read-Only Product Detail Dialog */}
      <Dialog
        open={detailProduct !== null}
        onOpenChange={(open) => {
          if (!open) setDetailProduct(null);
        }}
      >
        {detailProduct &&
          (() => {
            const imagesList =
              detailProduct.images && detailProduct.images.length > 0
                ? detailProduct.images
                : [detailProduct.imageUrl];
            const activeImage = imagesList[activeImageIndex] || detailProduct.imageUrl;
            const totalStock = detailProduct.stock ?? detailProduct.variants.reduce((acc, v) => acc + (v.stock || (v.inStock ? 10 : 0)), 0);

            return (
              <DialogContent className="sm:max-w-4xl bg-card border-border/40 rounded-3xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-h-[75vh] overflow-y-auto pr-1">
                  {/* Left: Gallery (7 cols on desktop) */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    {/* Main Active Image View */}
                    <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-muted/20 border border-border/10 group">
                      <Image
                        src={activeImage}
                        alt={`${detailProduct.name} View`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-all duration-300"
                        priority
                      />

                      {/* Image index indicator */}
                      {imagesList.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white rounded-lg">
                          {activeImageIndex + 1} / {imagesList.length}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Row */}
                    {imagesList.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {imagesList.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={cn(
                              'relative w-16 aspect-4/5 shrink-0 overflow-hidden rounded-lg bg-muted/20 border transition-all cursor-pointer',
                              activeImageIndex === idx
                                ? 'border-foreground ring-1 ring-foreground opacity-100'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            )}
                          >
                            <Image
                              src={img}
                              alt={`${detailProduct.name} thumb ${idx + 1}`}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Info & Specs (5 cols on desktop) */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Category & Edition tags */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
                          {detailProduct.edition}
                        </span>
                        <div className="pr-6">{getStatusBadge(detailProduct)}</div>
                      </div>

                      {/* Title & Price */}
                      <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                          {detailProduct.name}
                        </h2>
                        <p className="text-lg font-black text-foreground/90 mt-1 tabular-nums">
                          {formatIDR(detailProduct.price)}
                        </p>
                      </div>

                      {/* Stock Summary Banner */}
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/20 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-emerald-500" />
                          Ketersediaan Stok:
                        </span>
                        <span className="text-xs font-extrabold text-foreground font-mono">
                          {detailProduct.stockMode === 'ALWAYS_AVAILABLE' ? 'Selalu Ready (Tanpa Batas)' : `${totalStock} pcs`}
                        </span>
                      </div>

                      {/* Materials & Care Breakdown */}
                      <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/15 space-y-1.5">
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Shirt className="h-3.5 w-3.5" />
                          Materials & Care
                        </span>
                        <div className="text-[11px] space-y-1 text-foreground/90">
                          <div><strong className="font-semibold text-muted-foreground">Fabric:</strong> {detailProduct.materialsAndCare?.fabric || '100% Premium Cotton, 280gsm'}</div>
                          <div><strong className="font-semibold text-muted-foreground">Treatment:</strong> {detailProduct.materialsAndCare?.treatment || 'Pre-shrunk'}</div>
                          <div><strong className="font-semibold text-muted-foreground">Origin:</strong> {detailProduct.materialsAndCare?.origin || 'Constructed in Indonesia'}</div>
                          <div><strong className="font-semibold text-muted-foreground">Care:</strong> {detailProduct.materialsAndCare?.careInstruction || 'Machine wash cold inside out'}</div>
                        </div>
                      </div>

                      {/* Category Text */}
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                        <Layers className="h-3.5 w-3.5" />
                        Kategori:{' '}
                        <span className="text-foreground capitalize">
                          {detailProduct.category.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Description */}
                      {detailProduct.description && (
                        <div className="space-y-1 pt-1 border-t border-border/15">
                          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-bold">
                            Deskripsi
                          </span>
                          <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                            {detailProduct.description}
                          </p>
                        </div>
                      )}

                      {/* Color Info */}
                      <div className="space-y-1.5 pt-1 border-t border-border/15">
                        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-bold">
                          Warna / Color
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-md border border-border/30 shadow-xs shrink-0"
                            style={{ backgroundColor: detailProduct.colorHex }}
                          />
                          <p className="text-xs font-bold text-foreground">{detailProduct.color}</p>
                        </div>
                      </div>

                      {/* Sizing Stock status */}
                      <div className="space-y-1.5 pt-1 border-t border-border/15">
                        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-bold">
                          Rincian Stok Per Ukuran
                        </span>
                        {detailProduct.stockMode === 'ALWAYS_AVAILABLE' ? (
                          <p className="text-xs text-muted-foreground italic">Semua ukuran selalu ready stock.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {detailProduct.variants.map((v) => {
                              const qty = v.stock ?? (v.inStock ? 10 : 0);
                              return (
                                <div
                                  key={v.size}
                                  className={cn(
                                    'h-9 px-3 flex items-center justify-between text-xs font-bold border rounded-xl select-none transition-all',
                                    qty > 0
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-muted/40 text-muted-foreground border-border/30 line-through opacity-40'
                                  )}
                                >
                                  <span>Ukuran {v.size}</span>
                                  <span className="font-mono">{qty > 0 ? `${qty} pcs` : 'Habis'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-border/20">
                      <Button
                        variant="outline"
                        onClick={() => setDetailProduct(null)}
                        className="flex-1 h-10 rounded-xl text-xs cursor-pointer font-bold"
                      >
                        Tutup
                      </Button>
                      <Button
                        onClick={() => {
                          const prod = detailProduct;
                          setDetailProduct(null);
                          handleOpenEdit(prod);
                        }}
                        className="flex-1 h-10 rounded-xl text-xs cursor-pointer gap-1.5 font-bold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Produk & Stok
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            );
          })()}
      </Dialog>
    </VStack>
  );
}
