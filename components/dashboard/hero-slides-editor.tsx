'use client';

import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/shared/image-upload';
import { cn } from '@/lib/utils';
import type { HeroSlide } from '@/types/store-settings.types';

interface HeroSlidesEditorProps {
  slides: HeroSlide[];
  onAdd: () => void;
  onUpdate: (id: string, changes: Partial<HeroSlide>) => void;
  onReorder: (sourceId: string, targetId: string) => void;
  onRemove: (id: string) => void;
}

export function HeroSlidesEditor({ slides, onAdd, onUpdate, onReorder, onRemove }: HeroSlidesEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-border/20 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-foreground">Slide Banner</h4>
          <p className="text-xs text-muted-foreground">
            Tambahkan slide sebanyak yang diperlukan. Tarik kartu untuk mengatur urutan tampil di homepage.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAdd} className="h-9 gap-2 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" /> Tambah Slide
        </Button>
      </div>

      {slides.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <p className="text-xs font-semibold text-foreground">Belum ada slide banner</p>
          <p className="mt-1 text-xs text-muted-foreground">Tambahkan slide untuk menampilkan banner homepage.</p>
        </div>
      )}

      {slides.map((slide, index) => (
        <article
          key={slide.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', slide.id);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const sourceId = event.dataTransfer.getData('text/plain');
            if (sourceId && sourceId !== slide.id) onReorder(sourceId, slide.id);
          }}
          className="rounded-2xl border border-border/50 bg-muted/5 p-4 shadow-2xs"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="cursor-grab text-muted-foreground" title="Tarik untuk mengurutkan">
                <GripVertical className="h-5 w-5" />
              </span>
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-foreground px-2 text-xs font-bold text-background">{index + 1}</span>
              <div>
                <p className="text-xs font-bold text-foreground">Slide {index + 1}</p>
                <p className="text-[10px] text-muted-foreground">Rasio gambar 16:9</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onUpdate(slide.id, { isActive: !slide.isActive })}
                aria-label={slide.isActive ? 'Nonaktifkan slide' : 'Aktifkan slide'}
              >
                {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(slide.id)} aria-label="Hapus slide">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Gambar Banner</Label>
              <ImageUpload
                value={slide.imageUrl}
                onChange={(imageUrl) => onUpdate(slide.id, { imageUrl })}
                aspectRatio="16:9"
                placeholder="Upload gambar banner 16:9"
                helperText="Gunakan gambar lebar agar tampil baik di desktop dan mobile."
              />
            </div>

            <div className="grid content-start gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`${slide.id}-alt`} className="text-xs font-bold">Alt Text Gambar</Label>
                <Input id={`${slide.id}-alt`} value={slide.altText} onChange={(event) => onUpdate(slide.id, { altText: event.target.value })} placeholder="Deskripsi gambar untuk aksesibilitas" className="h-10 rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${slide.id}-title`} className="text-xs font-bold">Judul Slide</Label>
                <Input id={`${slide.id}-title`} value={slide.title || ''} onChange={(event) => onUpdate(slide.id, { title: event.target.value })} placeholder="EDITION 001" className="h-10 rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${slide.id}-subtitle`} className="text-xs font-bold">Subjudul</Label>
                <Input id={`${slide.id}-subtitle`} value={slide.subtitle || ''} onChange={(event) => onUpdate(slide.id, { subtitle: event.target.value })} placeholder="ARCHIVAL COTTON SILHOUETTE" className="h-10 rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${slide.id}-cta-text`} className="text-xs font-bold">Teks CTA</Label>
                <Input id={`${slide.id}-cta-text`} value={slide.ctaText || ''} onChange={(event) => onUpdate(slide.id, { ctaText: event.target.value })} placeholder="Eksplor Koleksi" className="h-10 rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${slide.id}-cta-link`} className="text-xs font-bold">Link CTA</Label>
                <Input id={`${slide.id}-cta-link`} value={slide.ctaLink || ''} onChange={(event) => onUpdate(slide.id, { ctaLink: event.target.value })} placeholder="/catalogue" className="h-10 rounded-xl text-xs font-mono" />
              </div>
            </div>
          </div>

          <div className={cn('mt-4 rounded-lg px-3 py-2 text-[11px]', slide.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground')}>
            {slide.isActive ? 'Slide aktif dan akan tampil di homepage.' : 'Slide nonaktif dan tidak akan tampil di homepage.'}
          </div>
        </article>
      ))}
    </div>
  );
}
