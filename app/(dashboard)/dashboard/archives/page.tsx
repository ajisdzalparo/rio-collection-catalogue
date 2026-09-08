'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/shared/image-upload';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useArchives, type ArchiveInput } from '@/hooks/use-archives';
import { useJournals } from '@/hooks/use-journals';
import { useRbac } from '@/features/users/hooks/use-rbac';
import type { ArchiveCollection } from '@/types/catalogue.types';

const emptyArchive: ArchiveInput = { name: '', slug: '', description: '', imageUrl: '', journalId: null };

export default function ArchivesPage() {
  const { data = [], isLoading, error, save, remove } = useArchives();
  const { data: journals = [] } = useJournals();
  const { hasPermission } = useRbac();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<ArchiveInput>(emptyArchive);
  const [deleting, setDeleting] = useState<ArchiveCollection | null>(null);
  const [formError, setFormError] = useState('');

  function edit(archive?: ArchiveCollection) {
    setEditingId(archive?.id);
    setForm(archive ? { name: archive.name, slug: archive.slug, description: archive.description,
      imageUrl: archive.imageUrl, journalId: archive.journalId ?? null } : emptyArchive);
    setFormError('');
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError('');
    try {
      await save.mutateAsync({ id: editingId, data: form });
      setOpen(false);
      toast.success('Arsip tersimpan');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Gagal menyimpan arsip');
    }
  }

  const columns: Column<ArchiveCollection>[] = [
    { header: 'Nama Arsip', accessorKey: 'name' },
    { header: 'Slug', accessorKey: 'slug' },
    { header: 'Artikel', cell: (item) => journals.find((journal) => journal.id === item.journalId)?.title || 'Belum ditautkan' },
    { header: 'Aksi', cell: (item) => <div className="flex gap-2">
      {hasPermission('products.edit') && <Button variant="outline" onClick={() => edit(item)}>Edit</Button>}
      {hasPermission('products.delete') && <Button variant="destructive" onClick={() => setDeleting(item)}>Hapus</Button>}
    </div> }
  ];

  if (!hasPermission('products.view')) return <p>Akses arsip tidak tersedia untuk peran Anda.</p>;

  return <section className="space-y-6">
    <header className="flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Historical Archive</h1>
        <p className="text-sm text-muted-foreground">Kelola koleksi arsip dan pilih artikel jurnal yang dituju.</p></div>
      {hasPermission('products.create') && <Button onClick={() => edit()}>Tambah Arsip</Button>}
    </header>
    {error && <p role="alert">{error.message}</p>}
    <DataTable columns={columns} data={data} isLoading={isLoading} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingId ? 'Edit Arsip' : 'Tambah Arsip'}</DialogTitle>
          <DialogDescription>Perubahan akan tampil di katalog dan halaman Archive.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="archive-name">Nama</Label><Input id="archive-name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="archive-slug">Slug</Label><Input id="archive-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="edition-001" /></div>
          <div><Label htmlFor="archive-description">Deskripsi</Label><Textarea id="archive-description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><p className="text-sm font-medium">Gambar Arsip</p><ImageUpload value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })} /></div>
          <div><Label htmlFor="archive-journal">Artikel Jurnal</Label>
            <select id="archive-journal" className="w-full rounded-md border bg-background p-2" value={form.journalId || ''}
              onChange={(e) => setForm({ ...form, journalId: e.target.value || null })}>
              <option value="">Tanpa artikel — buka daftar jurnal</option>
              {journals.map((journal) => <option key={journal.id} value={journal.id}>{journal.title}</option>)}
            </select></div>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" disabled={save.isPending || !form.imageUrl}>{save.isPending ? 'Menyimpan…' : 'Simpan'}</Button>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmModal open={!!deleting} onOpenChange={(value) => { if (!value) setDeleting(null); }}
      title="Hapus arsip?" description={`Arsip ${deleting?.name || ''} akan dihapus dari katalog.`}
      isLoading={remove.isPending} onConfirm={() => {
        if (deleting) remove.mutate(deleting.id, {
          onSuccess: () => toast.success('Arsip dihapus'), onError: (error) => toast.error(error.message)
        });
      }} />
  </section>;
}
