'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Calendar,
  ImageIcon,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

export default function TestimoniesCmsPage() {
  const {
    data: testimonies,
    addTestimony,
    updateTestimony,
    deleteTestimony,
    toggleTestimonyStatus
  } = useTestimonies();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Silakan upload gambar screenshot testimoni terlebih dahulu.');
      return;
    }

    if (editingItem) {
      updateTestimony(editingItem.id, formData);
    } else {
      addTestimony({
        ...formData,
        alt: formData.alt || formData.clientName || 'Bukti Chat WhatsApp'
      });
    }
    setDialogOpen(false);
  };

  const columns: Column<Testimony>[] = [
    {
      accessorKey: 'imageUrl',
      header: 'Screenshot Testimoni',
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
      cell: (item: Testimony) => (
        <CMSBadge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {item.status === 'ACTIVE' ? 'Aktif (Tampil)' : 'Disembunyikan'}
        </CMSBadge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Dibuat',
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenDetail(item)}
            title="Lihat Detail Testimoni"
            className="text-primary hover:bg-primary/10"
          >
            <Info size={15} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleTestimonyStatus(item.id)}
            title={item.status === 'ACTIVE' ? 'Sembunyikan' : 'Tampilkan'}
          >
            {item.status === 'ACTIVE' ? (
              <EyeOff size={15} className="text-muted-foreground" />
            ) : (
              <Eye size={15} className="text-emerald-600" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(item)}
            title="Edit Testimoni"
          >
            <Edit size={15} className="text-muted-foreground" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteTestimony(item.id)}
            title="Hapus Testimoni"
            className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
        data={testimonies}
        searchPlaceholder="Cari nama atau keterangan..."
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Screenshot Testimoni' : 'Tambah Screenshot Testimoni'}
            </DialogTitle>
            <DialogDescription>
              Upload file gambar tangkapan layar percakapan WhatsApp untuk ditampilkan di halaman
              depan katalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Image Upload Area */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                File Screenshot / Gambar *
              </label>

              <div className="space-y-2">
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                  aspectRatio="9:16"
                  placeholder="Pilih atau drop screenshot chat WhatsApp (9:16)"
                  helperText="Foto otomatis dipotong dengan rasio portrait 9:16 agar pas dengan kartu testimoni"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Keterangan / Nama Klien (Opsional)
              </label>
              <Input
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Misal: Harish Prabha - Chennai"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/10">
              <div className="space-y-0.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Tampil
                </label>
                <span className="text-xs text-muted-foreground">
                  {formData.status === 'ACTIVE' ? 'Aktif (Tampil di Katalog)' : 'Disembunyikan'}
                </span>
              </div>
              <Switch
                checked={formData.status === 'ACTIVE'}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? 'ACTIVE' : 'HIDDEN'
                  })
                }
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">{editingItem ? 'Simpan Perubahan' : 'Upload Testimoni'}</Button>
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
