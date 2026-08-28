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
  Upload,
  Calendar,
  ImageIcon,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
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
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.alt || item.clientName || 'Testimonial'}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No Img
            </div>
          )}
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
        <Badge
          variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}
          className={
            item.status === 'ACTIVE'
              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
              : 'bg-zinc-500/15 text-zinc-500'
          }
        >
          {item.status === 'ACTIVE' ? 'Aktif (Tampil)' : 'Disembunyikan'}
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Dibuat',
      cell: (item: Testimony) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={13} />
          <span>{item.createdAt || '2026-08-01'}</span>
        </div>
      )
    },
    {
      accessorKey: 'id',
      header: 'Aksi',
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
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
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

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
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

              <div className="space-y-3">
                {formData.imageUrl ? (
                  <div className="relative h-44 w-full rounded-xl overflow-hidden border border-border/60 bg-muted/20 flex items-center justify-center group">
                    <Image src={formData.imageUrl} alt="Preview" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                        <Upload size={14} />
                        Ganti Gambar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border/80 rounded-xl hover:border-primary/50 bg-muted/10 cursor-pointer transition-colors p-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-foreground">
                      Klik untuk Upload Screenshot Chat
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP (Maksimal 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    atau URL Gambar:
                  </span>
                  <Input
                    value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="/images/testimonials/testimony-1.png"
                    className="text-xs h-8"
                  />
                </div>
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Status Tampil
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'ACTIVE' | 'HIDDEN'
                  })
                }
                className="w-full h-10 px-3 rounded-lg border border-border/60 bg-background text-sm outline-none cursor-pointer"
              >
                <option value="ACTIVE">Aktif (Tampil di Katalog)</option>
                <option value="HIDDEN">Disembunyikan</option>
              </select>
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
                  <Badge
                    variant={detailItem.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={
                      detailItem.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20 text-[10px]'
                        : 'text-[10px]'
                    }
                  >
                    {detailItem.status === 'ACTIVE' ? 'Aktif (Tampil)' : 'Disembunyikan'}
                  </Badge>
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
