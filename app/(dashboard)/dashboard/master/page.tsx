'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Building2, Shirt, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { VStack, Flex } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useCategoriesQuery,
  useColorsQuery,
  useSizesQuery,
  useTopicsQuery,
  useBanksQuery,
  useMaterialsQuery,
  useMasterMutations,
  type CategoryItem,
  type ColorItem,
  type TopicItem,
  type BankItem,
  type SizeItem,
  type MaterialItem
} from '@/hooks/use-master-data';

function MasterDataPageContent() {
  const searchParams = useSearchParams();

  // Pure React Query hooks connected directly to the PostgreSQL Database
  const { data: categories = [], isLoading: loadingCats } = useCategoriesQuery();
  const { data: colors = [], isLoading: loadingCols } = useColorsQuery();
  const { data: sizes = [], isLoading: loadingSizes } = useSizesQuery();
  const { data: topics = [], isLoading: loadingTopics } = useTopicsQuery();
  const { data: banks = [], isLoading: loadingBanks } = useBanksQuery();
  const { data: materials = [], isLoading: loadingMaterials } = useMaterialsQuery();

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
    materials: {
      title: 'Spesifikasi Bahan (Materials & Origin)',
      desc: 'Kelola master opsi bahan kain (Fabric) dan negara asal (Origin).'
    },
    topics: {
      title: 'Topik Blog',
      desc: 'Kelola topik tulisan untuk artikel blog editorial.'
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
    type: 'cat' | 'col' | 'top' | 'bank' | 'material';
    id: string;
  } | null>(null);

  const [activeMaterialSubTab, setActiveMaterialSubTab] = useState<'FABRIC' | 'ORIGIN'>('FABRIC');
  const [materialType, setMaterialType] = useState<'FABRIC' | 'ORIGIN'>('FABRIC');
  const [itemName, setItemName] = useState('');
  const [itemHex, setItemHex] = useState('#1A1A1A');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemLogoUrl, setItemLogoUrl] = useState('');

  const masterMutations = useMasterMutations();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemName('');
    setItemHex('#1A1A1A');
    setItemDesc('');
    setItemCode('');
    setItemLogoUrl('');
    setMaterialType(activeTab === 'materials' ? activeMaterialSubTab : 'FABRIC');
    setIsDialogOpen(true);
  };

  const handleOpenCreateWithType = (type: 'FABRIC' | 'ORIGIN') => {
    setEditingItem(null);
    setItemName('');
    setItemHex('#1A1A1A');
    setItemDesc('');
    setItemCode('');
    setItemLogoUrl('');
    setMaterialType(type);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (
    type: 'cat' | 'col' | 'top' | 'bank' | 'material',
    item: {
      id: string;
      name: string;
      hex?: string;
      description?: string | null;
      code?: string | null;
      logoUrl?: string | null;
      type?: string;
    }
  ) => {
    setEditingItem({ type, id: item.id });
    setItemName(item.name);
    setItemHex(item.hex || '#1A1A1A');
    setItemDesc(item.description || '');
    setItemCode(item.code || '');
    setItemLogoUrl(item.logoUrl || '');
    if (item.type && (item.type === 'FABRIC' || item.type === 'ORIGIN')) {
      setMaterialType(item.type);
    }
    setIsDialogOpen(true);
  };

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
          toast.success(`Kategori "${itemName}" berhasil diperbarui`);
        } else if (editingItem.type === 'col') {
          await masterMutations.updateColor({ id: editingItem.id, name: itemName, hex: itemHex });
          toast.success(`Warna "${itemName}" berhasil diperbarui`);
        } else if (editingItem.type === 'top') {
          await masterMutations.updateTopic({
            id: editingItem.id,
            name: itemName,
            description: itemDesc
          });
          toast.success(`Topik "${itemName}" berhasil diperbarui`);
        } else if (editingItem.type === 'bank') {
          await masterMutations.updateBank({
            id: editingItem.id,
            name: itemName,
            code: itemCode,
            logoUrl: itemLogoUrl
          });
          toast.success('Master bank berhasil diperbarui');
        } else if (editingItem.type === 'material') {
          await masterMutations.updateMaterial({
            id: editingItem.id,
            name: itemName,
            description: itemDesc
          });
          toast.success('Master material berhasil diperbarui');
        }
      } else {
        if (activeTab === 'categories') {
          await masterMutations.addCategory({ name: itemName, description: itemDesc });
          toast.success(`Kategori "${itemName}" berhasil ditambahkan`);
        } else if (activeTab === 'colors') {
          await masterMutations.addColor({ name: itemName, hex: itemHex });
          toast.success(`Warna "${itemName}" berhasil ditambahkan`);
        } else if (activeTab === 'topics') {
          await masterMutations.addTopic({ name: itemName, description: itemDesc });
          toast.success(`Topik "${itemName}" berhasil ditambahkan`);
        } else if (activeTab === 'sizes') {
          const upperSize = itemName.trim().toUpperCase();
          if (upperSize) {
            await masterMutations.addSize({ size: upperSize });
            toast.success(`Ukuran "${upperSize}" berhasil ditambahkan`);
          }
        } else if (activeTab === 'banks') {
          await masterMutations.addBank({
            name: itemName,
            code: itemCode || itemName.toUpperCase(),
            logoUrl: itemLogoUrl
          });
          toast.success('Master bank baru berhasil ditambahkan');
        } else if (activeTab === 'materials') {
          await masterMutations.addMaterial({
            type: materialType,
            name: itemName,
            description: itemDesc
          });
          toast.success('Opsi material baru berhasil ditambahkan');
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save master item:', error);
      toast.error('Gagal menyimpan data master');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'cat' | 'col' | 'top' | 'bank' | 'size' | 'material';
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = (
    type: 'cat' | 'col' | 'top' | 'bank' | 'size' | 'material',
    id: string,
    name: string
  ) => {
    setDeleteTarget({ type, id, name });
  };

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    try {
      if (type === 'cat') {
        await masterMutations.deleteCategory(id);
      } else if (type === 'col') {
        await masterMutations.deleteColor(id);
      } else if (type === 'top') {
        await masterMutations.deleteTopic(id);
      } else if (type === 'bank') {
        await masterMutations.deleteBank(id);
      } else if (type === 'size') {
        await masterMutations.deleteSize(id);
      } else if (type === 'material') {
        await masterMutations.deleteMaterial(id);
      }
      toast.success(`Berhasil menghapus "${name}"`);
    } catch (error) {
      console.error('Failed to delete master item:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setDeleteTarget(null);
    }
  };

  const sizeColumns: Column<SizeItem>[] = [
    { header: 'Ukuran', accessorKey: 'size', sortable: true, className: 'font-bold text-xs' },
    {
      header: 'Status',
      className: 'w-24',
      cell: (item) => (
        <Switch
          checked={item.isActive}
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.toggleSize({ size: item.size, isActive: checked });
              toast.success(
                `Ukuran "${item.size}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
              );
            } catch (error) {
              console.error(error);
              toast.error('Gagal memperbarui status ukuran');
            }
          }}
        />
      )
    },
    {
      header: 'Aksi',
      className: 'text-right w-24',
      cell: (item) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('size', item.size, item.size)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

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
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateCategory({ id: item.id, isActive: checked });
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
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateColor({ id: item.id, isActive: checked });
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

  const topicColumns: Column<TopicItem>[] = [
    {
      header: 'Nama Topik Blog',
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
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateTopic({ id: item.id, isActive: checked });
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
            {item.code && (
              <p className="font-mono text-[10px] text-muted-foreground">{item.code}</p>
            )}
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
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateBank({ id: item.id, isActive: checked });
              toast.success(
                `Bank "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
              );
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

  const sectionMaterialColumns: Column<MaterialItem>[] = [
    {
      header: 'Nama / Nilai Master Opsi',
      accessorKey: 'name',
      sortable: true,
      className: 'font-bold text-xs w-1/3'
    },
    {
      header: 'Keterangan / Deskripsi',
      accessorKey: 'description',
      className: 'text-xs text-muted-foreground w-1/2',
      cell: (item) => item.description || '-'
    },
    {
      header: 'Status',
      className: 'w-20',
      cell: (item) => (
        <Switch
          checked={item.isActive}
          disabled={masterMutations.isPending}
          onCheckedChange={async (checked) => {
            try {
              await masterMutations.updateMaterial({ id: item.id, isActive: checked });
              toast.success(
                `Material "${item.name}" berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
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
            onClick={() => handleOpenEdit('material', item)}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete('material', item.id, item.name)}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const MATERIAL_TYPE_CONFIG: Record<
    'FABRIC' | 'ORIGIN',
    { title: string; label: string; placeholder: string }
  > = {
    FABRIC: {
      title: 'Fabric / Material Kain',
      label: 'Nama Fabric / Material Kain',
      placeholder: 'Misal: Cotton Combed 30s, Heavyweight Cotton 24s...'
    },
    ORIGIN: {
      title: 'Origin / Negara Asal',
      label: 'Nama Negara / Asal Material',
      placeholder: 'Misal: Indonesia, Made in Japan, Imported Cotton...'
    }
  };

  const MATERIAL_SECTIONS = [
    {
      type: 'FABRIC' as const,
      title: 'Fabric / Material Bahan',
      shortTitle: 'Fabric',
      desc: 'Master jenis kain/bahan utama kaos (misal: Cotton Combed 30s, Heavyweight Cotton 24s).',
      icon: <Shirt className="h-4 w-4" />,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    {
      type: 'ORIGIN' as const,
      title: 'Origin / Negara Asal',
      shortTitle: 'Origin',
      desc: 'Master asal material kain atau tempat manufaktur (misal: Made in Indonesia, Imported Cotton).',
      icon: <Globe className="h-4 w-4" />,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
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
      </Flex>

      {/* Tab Panels */}
      {activeTab === 'categories' && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-foreground">Kategori Kaos</h2>
              <p className="text-xs text-muted-foreground">
                Kelola daftar kategori produk kaos di katalog Anda.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Kategori</span>
            </Button>
          </div>
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
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-foreground">Master Warna</h2>
              <p className="text-xs text-muted-foreground">
                Kelola pilihan varian warna kain untuk produk.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Warna</span>
            </Button>
          </div>
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
        </div>
      )}

      {activeTab === 'materials' && (
        <Tabs
          value={activeMaterialSubTab}
          onValueChange={(val) => setActiveMaterialSubTab(val as 'FABRIC' | 'ORIGIN')}
          className="w-full space-y-4"
        >
          <TabsList
            variant="pills"
            className="w-full flex-wrap justify-start gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/40"
          >
            {MATERIAL_SECTIONS.map((section) => {
              const isActive = activeMaterialSubTab === section.type;
              return (
                <TabsTrigger
                  key={section.type}
                  value={section.type}
                  variant="pills"
                  className={cn(
                    'gap-2 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{section.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {MATERIAL_SECTIONS.map((section) => {
            const sectionData = materials.filter((m) => m.type === section.type);
            return (
              <TabsContent key={section.type} value={section.type} className="mt-2">
                <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
                    <div className="space-y-0.5">
                      <h2 className="text-base font-extrabold text-foreground">{section.title}</h2>
                      <p className="text-xs text-muted-foreground">{section.desc}</p>
                    </div>

                    <Button
                      onClick={() => handleOpenCreateWithType(section.type)}
                      size="sm"
                      className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah {section.shortTitle}</span>
                    </Button>
                  </div>

                  <DataTable
                    columns={sectionMaterialColumns}
                    data={sectionData}
                    isLoading={loadingMaterials}
                    searchKey="name"
                    searchPlaceholder={`Cari ${section.shortTitle.toLowerCase()}...`}
                    emptyTitle={`Belum Ada Data ${section.shortTitle}`}
                    emptyDescription={`Tambahkan opsi ${section.shortTitle.toLowerCase()} baru.`}
                    pageSize={10}
                  />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {activeTab === 'banks' && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-foreground">Master Bank Transfer</h2>
              <p className="text-xs text-muted-foreground">
                Kelola daftar bank yang tersedia untuk opsi pembayaran pelanggan.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Bank</span>
            </Button>
          </div>
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
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-foreground">Topik Blog / Editorial</h2>
              <p className="text-xs text-muted-foreground">
                Kelola kategori topik tulisan artikel dan blog editorial.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Topik</span>
            </Button>
          </div>
          <DataTable
            columns={topicColumns}
            data={topics}
            isLoading={loadingTopics}
            searchKey="name"
            searchPlaceholder="Cari topik blog..."
            emptyTitle="Belum Ada Topik Blog"
            emptyDescription="Tambahkan topik editorial/kategori tulisan blog baru."
            pageSize={10}
          />
        </div>
      )}

      {activeTab === 'sizes' && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-foreground">Master Ukuran Kaos</h2>
              <p className="text-xs text-muted-foreground">
                Kelola variasi standar ukuran kaos di katalog.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 rounded-xl font-bold text-xs h-9 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Ukuran</span>
            </Button>
          </div>
          <DataTable
            columns={sizeColumns}
            data={sizes}
            isLoading={loadingSizes}
            searchKey="size"
            searchPlaceholder="Cari ukuran..."
            emptyTitle="Belum Ada Ukuran"
            emptyDescription="Mulai tambahkan ukuran kaos baru."
            pageSize={10}
            getRowId={(item) => item.size}
          />
        </div>
      )}

      {/* Create / Edit Dialog Form */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !masterMutations.isPending && setIsDialogOpen(open)}
      >
        <DialogContent className="max-w-md bg-card border-border/40 rounded-2xl">
          <DialogHeader className="border-b border-border/20 pb-4">
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-widest text-muted-foreground/80">
              {editingItem
                ? 'Edit Data Master'
                : activeTab === 'sizes'
                  ? 'Tambah Ukuran Kaos'
                  : activeTab === 'materials'
                    ? `Tambah ${MATERIAL_TYPE_CONFIG[materialType]?.title || 'Material'} Baru`
                    : 'Tambah Data Master Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {editingItem
                ? 'Update detail parameter master data Anda.'
                : activeTab === 'materials'
                  ? `Lengkapi detail opsi baru untuk ${MATERIAL_TYPE_CONFIG[materialType]?.title || 'material'}.`
                  : `Lengkapi parameter baru untuk tab ${activeTab}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name" className="text-xs font-bold text-foreground">
                {activeTab === 'banks'
                  ? 'Nama / Label Bank'
                  : activeTab === 'sizes'
                    ? 'Nama / Kode Ukuran (misal: XS, 3XL, All Size)'
                    : activeTab === 'materials'
                      ? MATERIAL_TYPE_CONFIG[materialType]?.label || 'Nama Material'
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
                      : activeTab === 'materials'
                        ? MATERIAL_TYPE_CONFIG[materialType]?.placeholder ||
                          'Misal: Cotton Combed 30s...'
                        : 'Misal: Heavy-Weight, Crimson Red, Culture...'
                }
                className="h-10 rounded-xl text-xs"
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
              disabled={masterMutations.isPending}
              className="h-10 rounded-xl text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={masterMutations.isPending || !itemName.trim()}
              className="h-10 rounded-xl text-xs font-bold cursor-pointer"
            >
              {masterMutations.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Data Master"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDeleteAction}
        loading={masterMutations.isPending}
      />
    </VStack>
  );
}

export default function MasterPage() {
  return (
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <MasterDataPageContent />
    </Suspense>
  );
}
