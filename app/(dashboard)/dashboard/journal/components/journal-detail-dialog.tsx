'use client';

import Image from 'next/image';
import { Calendar, ImageIcon, Layers, SquarePen, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatSafeDate } from '@/lib/utils';
import type { JournalArticle } from '@/types/catalogue.types';

interface JournalDetailDialogProps {
  article: JournalArticle | null;
  onClose: () => void;
  onEdit: (article: JournalArticle) => void;
}

export function JournalDetailDialog({ article, onClose, onEdit }: JournalDetailDialogProps) {
  return (
    <Dialog open={article !== null} onOpenChange={(open) => !open && onClose()}>
      {article && (
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-hidden rounded-xl border-border/40 bg-card p-4 sm:max-w-2xl sm:rounded-2xl sm:p-6">
          <DialogHeader className="border-b border-border/20 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{article.title}</span>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center rounded-md border border-border/10 bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {article.category}
              </span>
              <span aria-hidden="true">&middot;</span>
              {formatSafeDate(article.date, { dateStyle: 'long' })}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60dvh] space-y-5 overflow-y-auto py-2 pr-1 sm:max-h-[65vh]">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <section className="space-y-3" aria-labelledby="journal-info-heading">
                <h3 id="journal-info-heading" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Informasi Artikel</h3>
                <div className="space-y-3 rounded-xl border border-border/20 bg-muted/15 p-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Penulis</span>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <p className="break-words text-sm font-bold text-foreground">{article.author}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Tanggal Rilis</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <p className="text-sm font-bold text-foreground">{formatSafeDate(article.date, { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                  {article.slug && (
                    <div className="space-y-0.5 border-t border-border/15 pt-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Slug</span>
                      <p className="break-all font-mono text-xs text-foreground/70">{article.slug}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3" aria-labelledby="journal-cover-heading">
                <h3 id="journal-cover-heading" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Cover Foto</h3>
                {article.imageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/20 bg-muted/20">
                    <Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 768px) 100vw, 300px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border/20 bg-muted/10">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </section>
            </div>

            {article.excerpt && (
              <section className="space-y-1.5 border-t border-border/20 pt-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Ringkasan / Excerpt</h3>
                <p className="break-words text-xs leading-relaxed text-foreground/80">{article.excerpt}</p>
              </section>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-border/20 pt-4">
            <Button variant="outline" onClick={onClose} className="h-10 rounded-xl text-xs">Tutup</Button>
            <Button onClick={() => onEdit(article)} className="h-10 gap-1.5 rounded-xl text-xs">
              <SquarePen className="h-3.5 w-3.5" />
              Edit Artikel
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
