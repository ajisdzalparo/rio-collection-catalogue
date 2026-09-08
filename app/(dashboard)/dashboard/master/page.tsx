'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Check, AlertCircle, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VStack, Flex } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  useMasterStore,
  useCategoriesQuery,
  useColorsQuery,
  useSizesQuery,
  useTopicsQuery,
  useEditionsQuery,
  useBanksQuery,
  useMasterMutations,
  type CategoryItem,
  type ColorItem,
  type TopicItem,
  type EditionItem,
  type BankItem
} from '@/hooks/use-master-data';
import { cn } from '@/lib/utils';

function MasterDataPageContent() {
  const searchParams = useSearchParams();

  // React Query hooks to fetch from native backend API
  const { data: mockCats, isLoading: loadingCats } = useCategoriesQuery();
  const { data: mockCols, isLoading: loadingCols } = useColorsQuery();
  const { data: mockSizes } = useSizesQuery();
  const { data: mockTopics, isLoading: loadingTopics } = useTopicsQuery();
  const { data: mockEditions, isLoading: loadingEditions } = useEditionsQuery();
  const { data: mockBanks, isLoading: loadingBanks } = useBanksQuery();

  const {
    categories,
    colors,
    sizes,
    topics,
    editions,
    banks,
    setCategories,
    setColors,
    setSizes,
    setTopics,
    setEditions,
    setBanks,
    addCategory,
    updateCategory,
    deleteCategory,
    addColor,
    updateColor,
    deleteColor,
    toggleSize,
    addSize,
    addTopic,
    updateTopic,
    deleteTopic,
    addEdition,
    updateEdition,
    deleteEdition,
    addBank,
    updateBank,
    deleteBank
  } = useMasterStore();

  // Sync VeloMock API data to Zustand master store if empty
  useEffect(() => {
    if (mockCats && categories.length === 0) setCategories(mockCats);
  }, [mockCats, categories, setCategories]);

  useEffect(() => {
    if (mockCols && colors.length === 0) setColors(mockCols);
  }, [mockCols, colors, setColors]);

  useEffect(() => {
    if (mockSizes && sizes.length === 0) setSizes(mockSizes);
  }, [mockSizes, sizes, setSizes]);

  useEffect(() => {
    if (mockTopics && topics.length === 0) setTopics(mockTopics);
  }, [mockTopics, topics, setTopics]);

  useEffect(() => {
    if (mockEditions && editions.length === 0) setEditions(mockEditions);
  }, [mockEditions, editions, setEditions]);

  useEffect(() => {
    if (mockBanks && banks.length === 0) setBanks(mockBanks);
  }, [mockBanks, banks, setBanks]);

  const activeTab = searchParams.get('tab') || 'categories';

  const tabTitles: Record<string, { title: string; desc: string }> = {
    categories: {
      title: 'Kategori Kaos',
      desc: 'Kelola data kategori kaos untuk katalog produk.'
    },
    colors: {
      title: 'Warna Kaos (Hex)',
      desc: 'Kelola kode warna kain standar yang digunakan pada model produk.'
    },
    sizes: {
      title: 'Ukuran Kaos (Sizes)',
      desc: 'Kelola standarisasi ukuran kaos yang aktif di catalog.'
    },
    editions: {
      title: 'Edisi / Drop Kaos',
      desc: 'Kelola edisi peluncuran rilis produk (drops).'
    },
    topics: {
      title: 'Topik Jurnal',
      desc: 'Kelola topik tulisan untuk jurnal editorial blog.'
    },
    banks: {
      title: 'Master Bank Pembayaran',
      desc: 'Kelola data daftar bank yang dapat dipilih untuk rekening pembayaran toko.'
    }
  };

  const currentInfo = tabTitles[activeTab] || tabTitles.categories;

  // Dialog & Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'cat' | 'col' | 'top' | 'ed' | 'bank';
    id: string;
  } | null>(null);

  // Input fields
  const [itemName, setItemName] = useState('');
  const [itemHex, setItemHex] = useState('#1A1A1A');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemLogoUrl, setItemLogoUrl] = useState('');

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemName('');
    setItemHex('#1A1A1A');
    setItemDesc('');
    setItemCode('');
    setItemLogoUrl('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (
    type: 'cat' | 'col' | 'top' | 'ed' | 'bank',
    item: {
      id: string;
      name: string;
      hex?: string;
      description?: string;
      code?: string | null;
      logoUrl?: string | null;
    }
  ) => {
    setEditingItem({ type, id: item.id });
    setItemName(item.name);
    setItemHex(item.hex || '#1A1A1A');
    setItemDesc(item.description || '');
    setItemCode(item.code || '');
    setItemLogoUrl(item.logoUrl || '');
    setIsDialogOpen(true);
  };

  const masterMutations = useMasterMutations();

  const handleSave = async () => {
    if (!itemName.trim()) return;

    try {
      if (editingItem) {
        if (editingItem.type === 'cat') {
          await masterMutations.updateCategory({
            id: editingItem.id,
            name: itemName,
            description: itemDesc
          });
          updateCategory(editingItem.id, itemName, itemDesc);
        } else if (editingItem.type === 'col') {
          await masterMutations.updateColor({ id: editingItem.id, name: itemName, hex: itemHex });
          updateColor(editingItem.id, itemName, itemHex);
        } else if (editingItem.type === 'top') {
          await masterMutations.updateTopic({
            id: editingItem.id,
            name: itemName,
            description: itemDesc
          });
          updateTopic(editingItem.id, itemName, itemDesc);
        } else if (editingItem.type === 'ed') {
          updateEdition(editingItem.id, itemName, itemDesc);
        } else if (editingItem.type === 'bank') {
          await masterMutations.updateBank({
            id: editingItem.id,
            name: itemName,
            code: itemCode,
            logoUrl: itemLogoUrl
          });
          updateBank(editingItem.id, itemName, itemCode, itemLogoUrl);
          toast.success('Master bank berhasil diperbarui');
        }
      } else {
        if (activeTab === 'categories') {
          await masterMutations.addCategory({ name: itemName, description: itemDesc });
          addCategory(itemName, itemDesc);
        } else if (activeTab === 'colors') {
          await masterMutations.addColor({ name: itemName, hex: itemHex });
          addColor(itemName, itemHex);
        } else if (activeTab === 'topics') {
          await masterMutations.addTopic({ name: itemName, description: itemDesc });
          addTopic(itemName, itemDesc);
        } else if (activeTab === 'editions') {
          addEdition(itemName, itemDesc);
        } else if (activeTab === 'sizes') {
          const upperSize = itemName.trim().toUpperCase();
          if (upperSize) {
            try {
              await masterMutations.addSize({ size: upperSize });
            } catch {}
            addSize(upperSize);
            toast.success(`Ukuran "${upperSize}" berhasil ditambahkan`);
          }
        } else if (activeTab === 'banks') {
          await masterMutations.addBank({
            name: itemName,
            code: itemCode || itemName.toUpperCase(),
            logoUrl: itemLogoUrl
          });
          addBank(itemName, itemCode, itemLogoUrl);
          toast.success('Master bank baru berhasil ditambahkan');
        }
      }
    } catch (error) {
      console.error('Failed to save master item:', error);
      toast.error('Gagal menyimpan data master');
    }
    setIsDialogOpen(false);
  };

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'cat' | 'col' | 'top' | 'ed' | 'bank';
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = (type: 'cat' | 'col' | 'top' | 'ed' | 'bank', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
  };

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    try {
      if (type === 'cat') {
        await masterMutations.deleteCategory(id);
        deleteCategory(id);
      } else if (type === 'col') {
        await masterMutations.deleteColor(id);
        deleteColor(id);
      } else if (type === 'top') {
        await masterMutations.deleteTopic(id);
        deleteTopic(id);
      } else if (type === 'ed') {
        deleteEdition(id);
      } else if (type === 'bank') {
        await masterMutations.deleteBank(id);
        deleteBank(id);
      }
      toast.success(`Berhasil menghapus "${name}"`);
    } catch (error) {
      console.error('Failed to delete master item:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setDeleteTarget(null);
    }
  };
  // Categories Columns
  const categoryColumns: Column<CategoryItem>[] = [
    {
      header: 'Nama Kategori',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/4'
    },
    {
      header: 'Slug / URL Key',
      accessorKey: 'slug',
      className: 'font-mono text-[10px] text-muted-foreground w-1/4'
    },
    {
      header: 'Keterangan',
      accessorKey: 'description',
      className: 'text-xs text-muted-foreground w-1/4'
    },
    {
      header: 'Status',
      className: 'w-20',
      cell: (item) => (
        <Switch
          checked={item.isActive ?? true}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateCategory({ id: item.id, isActive: checked });
              updateCategory(item.id, undefined, undefined, checked);
              toast.success(
                `Kategori "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
              );
            } catch (error) {
              console.error(error);
              toast.error('Gagal memperbarui status');
            }
          }}
        />
      )
    },
    {
      header: 'Aksi',
      className: 'text-right w-24',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit('cat', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('cat', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Colors Columns
  const colorColumns: Column<ColorItem>[] = [
    {
      header: 'Preview',
      className: 'w-16',
      cell: (item) => (
        <div
          className="h-8 w-14 rounded-lg border border-border/40 shadow-xs"
          style={{ backgroundColor: item.hex }}
        />
      )
    },
    {
      header: 'Nama Warna',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/4'
    },
    {
      header: 'Kode Hex Color',
      accessorKey: 'hex',
      className: 'font-mono text-xs uppercase font-semibold text-muted-foreground w-1/4'
    },
    {
      header: 'Status',
      className: 'w-20',
      cell: (item) => (
        <Switch
          checked={item.isActive ?? true}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateColor({ id: item.id, isActive: checked });
              updateColor(item.id, undefined, undefined, checked);
              toast.success(
                `Warna "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
              );
            } catch (error) {
              console.error(error);
              toast.error('Gagal memperbarui status');
            }
          }}
        />
      )
    },
    {
      header: 'Aksi',
      className: 'text-right w-24',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit('col', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('col', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Topics Columns
  const topicColumns: Column<TopicItem>[] = [
    {
      header: 'Nama Topik Jurnal',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/3 uppercase tracking-wider'
    },
    {
      header: 'Deskripsi Topik',
      accessorKey: 'description',
      className: 'text-xs text-muted-foreground w-1/3'
    },
    {
      header: 'Status',
      className: 'w-20',
      cell: (item) => (
        <Switch
          checked={item.isActive ?? true}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateTopic({ id: item.id, isActive: checked });
              updateTopic(item.id, undefined, undefined, checked);
              toast.success(
                `Topik "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
              );
            } catch (error) {
              console.error(error);
              toast.error('Gagal memperbarui status');
            }
          }}
        />
      )
    },
    {
      header: 'Aksi',
      className: 'text-right w-24',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit('top', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('top', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Editions Columns
  const editionColumns: Column<EditionItem>[] = [
    {
      header: 'Nama Edisi / Drop',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/3'
    },
    {
      header: 'Slug / URL Key',
      accessorKey: 'slug',
      className: 'font-mono text-[10px] text-muted-foreground w-1/3'
    },
    {
      header: 'Keterangan Rilis',
      accessorKey: 'description',
      className: 'text-xs text-muted-foreground w-1/3'
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit('ed', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('ed', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Bank Columns
  const bankColumns: Column<BankItem>[] = [
    {
      header: 'Nama Bank',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/3 flex items-center gap-2',
      cell: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
            {item.code?.slice(0, 3) || <Building2 className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">{item.name}</p>
            {item.code && <p className="font-mono text-[10px] text-muted-foreground">{item.code}</p>}
          </div>
        </div>
      )
    },
    {
      header: 'Kode Bank',
      accessorKey: 'code',
      className: 'font-mono text-xs uppercase font-semibold text-muted-foreground w-1/4',
      cell: (item) => item.code || '-'
    },
    {
      header: 'Status',
      className: 'w-20',
      cell: (item) => (
        <Switch
          checked={item.isActive ?? true}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateBank({ id: item.id, isActive: checked });
              updateBank(item.id, undefined, undefined, undefined, checked);
              toast.success(`Bank "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`);
            } catch (error) {
              console.error(error);
              toast.error('Gagal memperbarui status bank');
            }
          }}
        />
      )
    },
    {
      header: 'Aksi',
      className: 'text-right w-24',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit('bank', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('bank', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <VStack gap="lg" className="pb-10">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {currentInfo.title}
          </h1>
          <p className="text-sm text-muted-foreground pt-1">{currentInfo.desc}</p>
        </VStack>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 h-10 px-4 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{activeTab === 'sizes' ? 'Tambah Ukuran' : 'Tambah Data'}</span>
        </Button>
      </Flex>

      {/* Tab Panels */}
      {activeTab === 'categories' && (
        <DataTable
          columns={categoryColumns}
          data={categories}
          isLoading={loadingCats}
          searchKey="name"
          searchPlaceholder="Cari kategori kaos..."
          emptyTitle="Belum Ada Kategori"
          emptyDescription="Mulai tambahkan kategori kaos baru di katalog Anda."
          pageSize={10}
        />
      )}

      {activeTab === 'colors' && (
        <DataTable
          columns={colorColumns}
          data={colors}
          isLoading={loadingCols}
          searchKey="name"
          searchPlaceholder="Cari warna..."
          emptyTitle="Belum Ada Warna"
          emptyDescription="Mulai tambahkan varian warna kain baru."
          pageSize={10}
        />
      )}

      {activeTab === 'banks' && (
        <DataTable
          columns={bankColumns}
          data={banks}
          isLoading={loadingBanks}
          searchKey="name"
          searchPlaceholder="Cari nama bank..."
          emptyTitle="Belum Ada Master Bank"
          emptyDescription="Mulai tambahkan nama bank baru untuk pilihan transfer pembayaran."
          pageSize={10}
        />
      )}

      {activeTab === 'editions' && (
        <DataTable
          columns={editionColumns}
          data={editions}
          isLoading={loadingEditions}
          searchKey="name"
          searchPlaceholder="Cari edisi atau drop kaos..."
          emptyTitle="Belum Ada Edisi / Drop"
          emptyDescription="Mulai tambahkan edisi rilis kaos baru."
          pageSize={10}
        />
      )}

      {activeTab === 'topics' && (
        <DataTable
          columns={topicColumns}
          data={topics}
          isLoading={loadingTopics}
          searchKey="name"
          searchPlaceholder="Cari topik jurnal..."
          emptyTitle="Belum Ada Topik Jurnal"
          emptyDescription="Tambahkan topik editorial/kategori tulisan blog baru."
          pageSize={10}
        />
      )}

      {activeTab === 'sizes' && (
        <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 max-w-2xl">
          <div className="flex items-start gap-3 bg-muted/20 border border-border/20 p-4 rounded-xl">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Atur Standarisasi Ukuran Kaos</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ukuran yang aktif akan muncul sebagai opsi checkbox saat menambah atau mengedit
                model kaos di Products CMS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={async () => {
                  const nextActive = !s.isActive;
                  try {
                    await masterMutations.toggleSize({ size: s.size, isActive: nextActive });
                    toggleSize(s.size);
                    toast.success(
                      `Ukuran "${s.size}" berhasil ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}`
                    );
                  } catch (error) {
                    console.error(error);
                    toast.error('Gagal memperbarui status ukuran');
                  }
                }}
                className={cn(
                  'h-14 flex items-center justify-between px-4 font-bold border rounded-2xl transition-all cursor-pointer select-none',
                  s.isActive
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'border-border/40 text-muted-foreground hover:border-foreground/30'
                )}
              >
                <span>Ukuran {s.size}</span>
                {s.isActive ? (
                  <Check className="h-4 w-4 text-background shrink-0" />
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase border border-border/40 px-1.5 py-0.5 rounded-md">
                    Nonaktif
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-14 flex items-center justify-center gap-2 px-4 font-bold border border-dashed border-border/60 hover:border-primary text-primary hover:bg-primary/5 rounded-2xl transition-all cursor-pointer select-none text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Ukuran</span>
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/40 rounded-2xl">
          <DialogHeader className="border-b border-border/20 pb-4">
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-widest text-muted-foreground/80">
              {editingItem ? 'Edit Data Master' : activeTab === 'sizes' ? 'Tambah Ukuran Kaos' : 'Tambah Data Master Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {editingItem
                ? 'Update detail parameter master data Anda.'
                : `Lengkapi parameter baru untuk tab ${activeTab === 'categories' ? 'Kategori Kaos' : activeTab === 'colors' ? 'Warna' : activeTab === 'sizes' ? 'Ukuran Kaos' : activeTab === 'banks' ? 'Master Bank' : 'Topik Jurnal'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name" className="text-xs font-bold text-foreground">
                {activeTab === 'banks'
                  ? 'Nama / Label Bank'
                  : activeTab === 'sizes'
                    ? 'Nama / Kode Ukuran (misal: XS, 3XL, All Size)'
                    : 'Nama'}
              </Label>
              <Input
                id="item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={
                  activeTab === 'banks'
                    ? 'Misal: Bank BCA, Mandiri, Bank Jago...'
                    : activeTab === 'sizes'
                      ? 'Misal: XS, 3XL, 4XL, All Size...'
                      : 'Misal: Heavy-Weight, Crimson Red, Culture...'
                }
                className="h-10 rounded-xl"
                required
              />
            </div>

            {activeTab === 'banks' && (
              <div className="space-y-1.5">
                <Label htmlFor="item-code" className="text-xs font-bold text-foreground">
                  Kode Singkat Bank (e.g. BCA, MANDIRI, BNI)
                </Label>
                <Input
                  id="item-code"
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  placeholder="BCA"
                  className="h-10 rounded-xl uppercase font-mono font-bold"
                />
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-1.5">
                <Label htmlFor="item-hex" className="text-xs font-bold text-foreground">
                  Hex Code Warna
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="item-hex"
                    type="color"
                    value={itemHex}
                    onChange={(e) => setItemHex(e.target.value)}
                    className="h-10 w-11 rounded-xl p-1 cursor-pointer bg-muted/40 border-border/40 shrink-0"
                  />
                  <Input
                    type="text"
                    value={itemHex}
                    onChange={(e) => setItemHex(e.target.value)}
                    className="h-10 grow rounded-xl uppercase text-center font-bold tracking-wider"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            )}

            {activeTab !== 'colors' && activeTab !== 'banks' && (
              <div className="space-y-1.5">
                <Label htmlFor="item-desc" className="text-xs font-bold text-foreground">
                  Keterangan / Deskripsi
                </Label>
                <Textarea
                  id="item-desc"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Penjelasan detail atau kegunaan data..."
                  className="min-h-20 rounded-xl text-xs"
                />
              </div>
            )}
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
              onClick={handleSave}
              disabled={!itemName.trim()}
              className="h-10 rounded-xl text-xs cursor-pointer font-bold"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Konfirmasi Hapus Data Master"
        description={
          deleteTarget ? `Apakah Anda yakin ingin menghapus "${deleteTarget.name}"?` : ''
        }
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={confirmDeleteAction}
      />
    </VStack>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading master panel...</p>
        </div>
      }
    >
      <MasterDataPageContent />
    </Suspense>
  );
}
