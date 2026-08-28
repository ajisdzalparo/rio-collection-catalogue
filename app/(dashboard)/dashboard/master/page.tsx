'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tag, Palette, Scaling, BookOpen, Plus, Check, AlertCircle, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VStack, Flex } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
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
  type CategoryItem,
  type ColorItem,
  type TopicItem,
  type EditionItem
} from '@/hooks/use-master-data';
import { cn } from '@/lib/utils';

function MasterDataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // React Query hooks to fetch from VeloMock staging API
  const { data: mockCats, isLoading: loadingCats } = useCategoriesQuery();
  const { data: mockCols, isLoading: loadingCols } = useColorsQuery();
  const { data: mockSizes } = useSizesQuery();
  const { data: mockTopics, isLoading: loadingTopics } = useTopicsQuery();
  const { data: mockEditions, isLoading: loadingEditions } = useEditionsQuery();

  const {
    categories,
    colors,
    sizes,
    topics,
    editions,
    setCategories,
    setColors,
    setSizes,
    setTopics,
    setEditions,
    addCategory,
    updateCategory,
    deleteCategory,
    addColor,
    updateColor,
    deleteColor,
    toggleSize,
    addTopic,
    updateTopic,
    deleteTopic,
    addEdition,
    updateEdition,
    deleteEdition
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

  const activeTab = searchParams.get('tab') || 'categories';

  const handleTabChange = (tab: string) => {
    router.push(`/dashboard/master?tab=${tab}`, { scroll: false });
  };

  // Dialog & Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'cat' | 'col' | 'top' | 'ed';
    id: string;
  } | null>(null);

  // Input fields
  const [itemName, setItemName] = useState('');
  const [itemHex, setItemHex] = useState('#1A1A1A');
  const [itemDesc, setItemDesc] = useState('');

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemName('');
    setItemHex('#1A1A1A');
    setItemDesc('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (
    type: 'cat' | 'col' | 'top' | 'ed',
    item: { id: string; name: string; hex?: string; description?: string }
  ) => {
    setEditingItem({ type, id: item.id });
    setItemName(item.name);
    setItemHex(item.hex || '#1A1A1A');
    setItemDesc(item.description || '');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!itemName.trim()) return;

    if (editingItem) {
      if (editingItem.type === 'cat') {
        updateCategory(editingItem.id, itemName, itemDesc);
      } else if (editingItem.type === 'col') {
        updateColor(editingItem.id, itemName, itemHex);
      } else if (editingItem.type === 'top') {
        updateTopic(editingItem.id, itemName, itemDesc);
      } else if (editingItem.type === 'ed') {
        updateEdition(editingItem.id, itemName, itemDesc);
      }
    } else {
      if (activeTab === 'categories') {
        addCategory(itemName, itemDesc);
      } else if (activeTab === 'colors') {
        addColor(itemName, itemHex);
      } else if (activeTab === 'topics') {
        addTopic(itemName, itemDesc);
      } else if (activeTab === 'editions') {
        addEdition(itemName, itemDesc);
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (type: 'cat' | 'col' | 'top' | 'ed', id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      if (type === 'cat') deleteCategory(id);
      else if (type === 'col') deleteColor(id);
      else if (type === 'top') deleteTopic(id);
      else if (type === 'ed') deleteEdition(id);
    }
  };

  // Categories Columns
  const categoryColumns: Column<CategoryItem>[] = [
    {
      header: 'Nama Kategori',
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
      header: 'Keterangan',
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
      className: 'font-bold text-xs w-1/3'
    },
    {
      header: 'Kode Hex Color',
      accessorKey: 'hex',
      className: 'font-mono text-xs uppercase font-semibold text-muted-foreground w-1/3'
    },
    {
      header: 'Aksi',
      className: 'text-right',
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
      className: 'font-bold text-xs w-1/2 uppercase tracking-wider'
    },
    {
      header: 'Deskripsi Topik',
      accessorKey: 'description',
      className: 'text-xs text-muted-foreground w-1/2'
    },
    {
      header: 'Aksi',
      className: 'text-right',
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

  return (
    <VStack gap="lg" className="pb-10">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Master Data</h1>
          <p className="text-sm text-muted-foreground pt-1">
            Konfigurasi parameter dasar seperti kategori produk, warna, ukuran, dan topik jurnal.
          </p>
        </VStack>

        {activeTab !== 'sizes' && (
          <Button
            onClick={handleOpenCreate}
            className="gap-2 h-10 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Data</span>
          </Button>
        )}
      </Flex>

      {/* Tabs Row */}
      <div className="flex border-b border-border/20 gap-1 pb-px overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('categories')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'categories'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Tag className="h-4 w-4" />
          Kategori Kaos
        </button>

        <button
          onClick={() => handleTabChange('colors')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'colors'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Palette className="h-4 w-4" />
          Warna (Hex)
        </button>

        <button
          onClick={() => handleTabChange('sizes')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'sizes'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Scaling className="h-4 w-4" />
          Ukuran (Sizes)
        </button>

        <button
          onClick={() => handleTabChange('editions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'editions'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="h-4 w-4" />
          Edisi / Drop Kaos
        </button>

        <button
          onClick={() => handleTabChange('topics')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'topics'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Topik Jurnal
        </button>
      </div>

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
                onClick={() => toggleSize(s.size)}
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
          </div>
        </div>
      )}

      {/* Create / Edit Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/40 rounded-2xl">
          <DialogHeader className="border-b border-border/20 pb-4">
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-widest text-muted-foreground/80">
              {editingItem ? 'Edit Data Master' : 'Tambah Data Master Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {editingItem
                ? 'Update detail parameter master data Anda.'
                : `Lengkapi parameter baru untuk tab ${activeTab === 'categories' ? 'Kategori Kaos' : activeTab === 'colors' ? 'Warna' : 'Topik Jurnal'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name" className="text-xs font-bold text-foreground">
                Nama / Label
              </Label>
              <Input
                id="item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Misal: Heavy-Weight, Crimson Red, Culture..."
                className="h-10 rounded-xl"
                required
              />
            </div>

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

            {activeTab !== 'colors' && (
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
