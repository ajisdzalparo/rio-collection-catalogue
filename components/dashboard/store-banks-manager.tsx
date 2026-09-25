'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Building2, Pencil, Trash2, CreditCard, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useBanksQuery } from '@/hooks/use-master-data';
import {
  useStoreBanksQuery,
  useStoreBankMutations,
  type StoreBankItem
} from '@/hooks/use-store-banks';

export function StoreBanksManager() {
  const { data: storeBanks = [], isLoading } = useStoreBanksQuery();
  const { data: masterBanks = [] } = useBanksQuery(true);
  const {
    addStoreBank,
    updateStoreBank,
    deleteStoreBank,
    reorderStoreBanks,
    isAdding,
    isUpdating,
    isDeleting
  } = useStoreBankMutations();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingBankId, setUpdatingBankId] = useState<string | null>(null);

  const isSubmitting = isSaving || isAdding || isUpdating;

  const items = useMemo(() => {
    return [...storeBanks].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [storeBanks]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    const updatedWithOrder = newItems.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1
    }));

    setDraggedIndex(null);
    setDragOverIndex(null);

    const payload = updatedWithOrder.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder
    }));

    try {
      await reorderStoreBanks(payload);
      toast.success('Urutan rekening berhasil diperbarui!');
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Gagal memperbarui urutan rekening');
    }
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreBankItem | null>(null);

  // Form states
  const [selectedMasterBank, setSelectedMasterBank] = useState<string>('');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountOwner, setAccountOwner] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<StoreBankItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSelectedMasterBank(masterBanks[0]?.name || '');
    setCustomBankName('');
    setAccountNumber('');
    setAccountOwner('');
    setIsActive(true);
    setSortOrder(storeBanks.length + 1);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: StoreBankItem) => {
    setEditingItem(item);
    const matchedMaster = masterBanks.find((b) => b.name === item.bankName);
    if (matchedMaster) {
      setSelectedMasterBank(matchedMaster.name);
      setCustomBankName('');
    } else {
      setSelectedMasterBank('CUSTOM');
      setCustomBankName(item.bankName);
    }
    setAccountNumber(item.accountNumber);
    setAccountOwner(item.accountOwner);
    setIsActive(item.isActive);
    setSortOrder(item.sortOrder);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    const finalBankName =
      selectedMasterBank === 'CUSTOM'
        ? customBankName.trim()
        : selectedMasterBank || customBankName.trim();

    if (!finalBankName || !accountNumber.trim() || !accountOwner.trim()) {
      toast.error('Semua kolom rekening bank wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateStoreBank({
          id: editingItem.id,
          bankName: finalBankName,
          accountNumber: accountNumber.trim(),
          accountOwner: accountOwner.trim(),
          isActive,
          sortOrder: Number(sortOrder) || 0
        });
        toast.success(`Rekening ${finalBankName} berhasil diperbarui`);
      } else {
        await addStoreBank({
          bankName: finalBankName,
          accountNumber: accountNumber.trim(),
          accountOwner: accountOwner.trim(),
          isActive,
          sortOrder: Number(sortOrder) || items.length + 1
        });
        toast.success(`Rekening ${finalBankName} berhasil ditambahkan`);
      }
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error('Failed to save store bank:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMsg = (error as any)?.response?.data?.message;
      toast.error(apiMsg || 'Gagal menyimpan data rekening bank toko');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStoreBank(deleteTarget.id);
      toast.success(`Rekening ${deleteTarget.bankName} berhasil dihapus`);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus rekening bank');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Rekening Pembayaran Toko (Transfer Manual)
        </h3>
        <Button
          type="button"
          onClick={handleOpenCreate}
          className="gap-1.5 h-9 px-3 rounded-xl cursor-pointer font-bold text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Rekening</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Rekening bank yang diaktifkan di bawah ini akan ditampilkan secara otomatis kepada pembeli
          pada halaman konfirmasi pesanan (order checkout) untuk transfer pembayaran manual.
        </p>
        {items.length > 1 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/40 shrink-0 select-none">
            <GripVertical className="h-3.5 w-3.5 text-primary" />
            <span>Drag &amp; drop kartu untuk ganti urutan</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
          Memuat daftar rekening pembayaran toko...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 border border-dashed border-border/40 rounded-xl text-center space-y-2">
          <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-semibold text-foreground">
            Belum Ada Rekening Pembayaran Toko
          </p>
          <p className="text-[11px] text-muted-foreground">
            Klik tombol &quot;Tambah Rekening&quot; di atas untuk menambahkan rekening bank transfer
            toko.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`p-4 border rounded-2xl transition-all flex flex-col justify-between space-y-3 cursor-grab active:cursor-grabbing select-none ${
                draggedIndex === index
                  ? 'opacity-40 border-primary border-dashed scale-[0.98] ring-2 ring-primary/30'
                  : dragOverIndex === index
                    ? 'border-primary ring-2 ring-primary/40 bg-muted/40 -translate-y-0.5'
                    : item.isActive
                      ? 'bg-card border-border/40 shadow-2xs hover:border-border/70 hover:shadow-xs'
                      : 'bg-muted/10 border-border/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-1 -ml-1.5 rounded-md transition-colors shrink-0"
                    title="Geser (drag) untuk mengubah urutan"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs shrink-0 uppercase">
                    {item.bankName.slice(0, 3)}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                      {item.bankName}
                    </span>
                    <p className="font-mono text-sm font-semibold text-foreground tracking-wider select-all pt-0.5">
                      {item.accountNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      a/n <span className="font-medium text-foreground">{item.accountOwner}</span>
                    </p>
                  </div>
                </div>

                <div onMouseDown={(e) => e.stopPropagation()}>
                  <Switch
                    checked={item.isActive}
                    disabled={updatingBankId === item.id}
                    onCheckedChange={async (checked) => {
                      setUpdatingBankId(item.id);
                      try {
                        await updateStoreBank({ id: item.id, isActive: checked });
                        toast.success(
                          `Rekening ${item.bankName} ${checked ? 'diaktifkan' : 'dinonaktifkan'}`
                        );
                      } catch (err) {
                        console.error(err);
                        toast.error('Gagal memperbarui status');
                      } finally {
                        setUpdatingBankId(null);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[11px]">
                <span className="text-muted-foreground/70 font-mono text-[10px] flex items-center gap-1">
                  <span>Urutan:</span>
                  <span className="font-bold text-foreground">#{index + 1}</span>
                </span>
                <div className="flex gap-1" onMouseDown={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(item)}
                    className="h-7 w-7 rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(item)}
                    className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/40 rounded-2xl">
          <DialogHeader className="border-b border-border/20 pb-3">
            <DialogTitle className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground/80">
              {editingItem ? 'Edit Rekening Pembayaran Toko' : 'Tambah Rekening Pembayaran Toko'}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Atur detail rekening bank toko untuk menerima transfer dari pelanggan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Pilih Nama Bank</Label>
              <Select
                value={selectedMasterBank}
                onValueChange={(val) => val && setSelectedMasterBank(val)}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border border-border/40 bg-background text-xs font-bold shadow-2xs">
                  <SelectValue placeholder="Pilih Bank..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-xl">
                  {masterBanks.map((b) => (
                    <SelectItem key={b.id} value={b.name} className="text-xs font-semibold py-2">
                      {b.name} {b.code ? `(${b.code})` : ''}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="text-xs font-semibold text-primary py-2">
                    -- Masukkan Nama Bank Lain --
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMasterBank === 'CUSTOM' && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-bank-name" className="text-xs font-bold text-foreground">
                  Nama Bank Kustom
                </Label>
                <Input
                  id="custom-bank-name"
                  type="text"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  placeholder="Misal: Bank Sulselbar, QRIS Toko, Dana..."
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="acc-number" className="text-xs font-bold text-foreground">
                Nomor Rekening / QRIS ID
              </Label>
              <Input
                id="acc-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="h-10 rounded-xl font-mono text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-owner" className="text-xs font-bold text-foreground">
                Atas Nama Pemilik Rekening (a/n)
              </Label>
              <Input
                id="acc-owner"
                type="text"
                value={accountOwner}
                onChange={(e) => setAccountOwner(e.target.value)}
                placeholder="RIO COLLECTION"
                className="h-10 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="sort-order" className="text-xs font-bold text-foreground">
                  Urutan Tampilan
                </Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <Label className="text-xs font-bold text-foreground pb-1">Status Aktif</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/20 pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsDialogOpen(false)}
              className="h-9 rounded-xl text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Rekening</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Konfirmasi Hapus Rekening"
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus rekening ${deleteTarget.bankName} (${deleteTarget.accountNumber})?`
            : ''
        }
        confirmText="Hapus Rekening"
        cancelText="Batal"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
