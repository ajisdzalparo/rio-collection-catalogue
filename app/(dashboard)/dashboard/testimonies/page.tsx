'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Eye,
  Calendar,
  ImageIcon,
  Info,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { SafeImage, CMSBadge } from '@/components/shared';
import { ImageUpload } from '@/components/shared/image-upload';
import { useTestimonies } from '@/hooks/use-testimonies';
import type { Testimony } from '@/types/catalogue.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

const TESTIMONY_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'ACTIVE', label: 'Aktif (Tampil)' },
  { value: 'HIDDEN', label: 'Disembunyikan (Draft)' }
];

export default function TestimoniesCmsPage() {
  const {
    data: testimonies,
    addTestimony,
    updateTestimony,
    deleteTestimony,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting
  } = useTestimonies();

  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftStatuses(appliedStatuses);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    setAppliedStatuses(draftStatuses);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftStatuses([]);
    setAppliedStatuses([]);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedStatuses.length;

  const filteredTestimonies = useMemo(() => {
    if (appliedStatuses.length === 0) return testimonies;
    return testimonies.filter((t) => appliedStatuses.includes(t.status || 'ACTIVE'));
  }, [testimonies, appliedStatuses]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimony | null>(null);
  const [detailItem, setDetailItem] = useState<Testimony | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    imageUrl: '',
    alt: '',
    status: 'ACTIVE' as 'ACTIVE' | 'HIDDEN'
  });

  const handleOpenDetail = (item: Testimony) => {
    setDetailItem(item);
    setDetailDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      clientName: '',
      imageUrl: '',
      alt: 'Bukti Chat WhatsApp Pelanggan',
      status: 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Testimony) => {
    setEditingItem(item);
    setFormData({
      clientName: item.clientName || '',
      imageUrl: item.imageUrl || '',
      alt: item.alt || 'Bukti Chat WhatsApp Pelanggan',
      status: item.status || 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      toast.error('Silakan upload gambar screenshot testimoni terlebih dahulu.');
      return;
    }

    try {
      if (editingItem) {
        await updateTestimony(editingItem.id, formData);
        toast.success('Testimoni berhasil diperbarui.');
      } else {
        await addTestimony({
          ...formData,
          alt: formData.alt || formData.clientName || 'Bukti Chat WhatsApp'
        });
        toast.success('Testimoni berhasil ditambahkan.');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Gagal menyimpan testimoni.');
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    try {
      await deleteTestimony(id);
      toast.success('Testimoni berhasil dihapus.');
    } catch {
      toast.error('Gagal menghapus testimoni.');
    }
  };

  const isSaving = isCreating || isUpdating;

  const columns: Column<Testimony>[] = [
    {
      accessorKey: 'imageUrl',
      header: 'Screenshot Testimoni',
      sortable: false,
      cell: (item: Testimony) => (
        <div className="relative h-20 w-14 overflow-hidden rounded-lg border border-border/60 bg-muted/30 shadow-xs">
          <SafeImage
            src={item.imageUrl}
            alt={item.alt || item.clientName || 'Testimonial'}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      )
    },
    {
      accessorKey: 'clientName',
      header: 'Keterangan / Klien',
      sortable: false,
      cell: (item: Testimony) => (
        <div>
          <span className="font-semibold text-foreground text-sm block">
            {item.clientName || item.alt || 'Bukti Chat WhatsApp'}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {item.alt || 'Screenshot Bukti Percakapan'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status Tampil',
      sortable: false,
      cell: (item: Testimony) => (
        <div className="flex items-center gap-2.5">
          <Switch
            size="lg"
            checked={item.status === 'ACTIVE'}
            disabled={isUpdating}
            onCheckedChange={(checked) => {
              void updateTestimony(item.id, { status: checked ? 'ACTIVE' : 'HIDDEN' }).catch(() => {
                toast.error('Gagal memperbarui status testimoni.');
              });
            }}
            aria-label={`${item.status === 'ACTIVE' ? 'Sembunyikan' : 'Tampilkan'} testimoni ${item.clientName || item.alt}`}
          />
          <span className="text-xs font-semibold text-muted-foreground">
            {item.status === 'ACTIVE' ? 'Aktif' : 'Disembunyikan'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Dibuat',
      sortable: true,
      cell: (item: Testimony) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={13} className="shrink-0" />
          <span>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : '-'}
          </span>
        </div>
      )
    },
    {
      header: 'Aksi',
      sortable: false,
      cell: (item: Testimony) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenDetail(item)}
            title="Lihat Detail"
            aria-label={`Lihat detail testimoni ${item.clientName || item.alt}`}
            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Eye size={15} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenEdit(item)}
            disabled={isSaving || isDeleting}
            title="Edit"
            className="h-8 w-8 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Edit size={15} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => void handleDeleteTestimony(item.id)}
            disabled={isDeleting || isSaving}
            title="Hapus"
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MessageSquare size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bukti Percakapan (Testimonials)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola & upload gambar tangkapan layar bukti chat WhatsApp kepuasan pelanggan secara
            langsung.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0 cursor-pointer">
          <Plus size={16} />
          <span>Tambah Testimoni</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Testimoni
          </span>
          <p className="text-2xl font-bold mt-1 text-foreground">{testimonies.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Testimoni Aktif
          </span>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {testimonies.filter((t) => t.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Disembunyikan
          </span>
          <p className="text-2xl font-bold mt-1 text-zinc-500">
            {testimonies.filter((t) => t.status === 'HIDDEN').length}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTestimonies}
        isLoading={isLoading}
        searchKey="clientName"
        extraSearchKeys={['alt']}
        searchPlaceholder="Cari nama atau keterangan..."
        filterComponents={
          <Sheet open={isFilterOpen} onOpenChange={handleOpenFilterDrawer}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader className="border-b border-border/30 pb-4 pr-8">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter Testimoni</span>
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Saring data testimoni pelanggan berdasarkan status tampilan.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Status Multi-Filter Section */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Status Tampilan</Label>
                  <MultiSelect
                    options={TESTIMONY_STATUS_OPTIONS}
                    value={draftStatuses}
                    onChange={setDraftStatuses}
                    placeholder="Semua Status Testimoni"
                    searchPlaceholder="Cari status..."
                    emptyText="Status tidak ditemukan"
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border/30 pt-4 flex flex-row items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        }
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !isSaving && setDialogOpen(open)}>
        <DialogContent className="w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingItem ? 'Edit Testimoni' : 'Tambah Testimoni'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unggah screenshot percakapan WhatsApp untuk ditampilkan pada slider beranda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Image Upload (9:16 Portrait) */}
              <div className="md:col-span-5 space-y-2">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Screenshot WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">Rasio vertikal 9:16</p>
                </div>
                <div className="overflow-hidden rounded-lg border border-border bg-muted/20 p-2">
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                    aspectRatio="9:16"
                    placeholder="Pilih screenshot"
                  />
                </div>
              </div>

              {/* Right Column: Details & Status */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nama Pelanggan / Keterangan
                  </label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Contoh: Harish - Jakarta"
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Opsional, untuk identifikasi internal & referensi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Teks Alternatif (Alt Text)
                  </label>
                  <Input
                    value={formData.alt}
                    onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                    placeholder="Deskripsi singkat gambar untuk aksesibilitas"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                  <div className="space-y-0.5 pr-2">
                    <label className="text-xs font-medium text-foreground cursor-pointer" htmlFor="testimony-status-switch">
                      Tampilkan di Katalog
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      {formData.status === 'ACTIVE'
                        ? 'Testimoni aktif dan muncul di beranda'
                        : 'Disembunyikan dari publik'}
                    </p>
                  </div>
                  <Switch
                    id="testimony-status-switch"
                    checked={formData.status === 'ACTIVE'}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        status: checked ? 'ACTIVE' : 'HIDDEN'
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving
                  ? 'Menyimpan...'
                  : editingItem
                    ? 'Simpan Perubahan'
                    : 'Tambah Testimoni'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Detail Screenshot Testimoni
            </DialogTitle>
            <DialogDescription>
              Tampilan lengkap screenshot bukti percakapan kepuasan pelanggan.
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 pt-2">
              {/* Full Image Preview */}
              <div className="relative w-full max-h-95 min-h-55 rounded-xl overflow-hidden border border-border/60 bg-muted/20 flex items-center justify-center p-2">
                {detailItem.imageUrl ? (
                  <Image
                    src={detailItem.imageUrl}
                    alt={detailItem.alt || detailItem.clientName || 'Screenshot Testimoni'}
                    width={400}
                    height={600}
                    className="max-h-90 w-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs">Gambar tidak tersedia</span>
                  </div>
                )}
              </div>

              {/* Info Details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                    Keterangan / Klien
                  </span>
                  <span className="font-medium text-foreground">
                    {detailItem.clientName || detailItem.alt || 'Bukti Chat WhatsApp'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                    Status Tampil
                  </span>
                  <CMSBadge variant={detailItem.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {detailItem.status === 'ACTIVE' ? 'Aktif (Tampil)' : 'Disembunyikan'}
                  </CMSBadge>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                    Tanggal Dibuat
                  </span>
                  <span className="text-foreground">{detailItem.createdAt || '2026-08-01'}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                    Alt Text
                  </span>
                  <span className="text-foreground truncate block" title={detailItem.alt}>
                    {detailItem.alt || '-'}
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                  Tutup
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenEdit(detailItem);
                  }}
                  className="gap-1.5"
                >
                  <Edit size={14} />
                  Edit Testimoni
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
