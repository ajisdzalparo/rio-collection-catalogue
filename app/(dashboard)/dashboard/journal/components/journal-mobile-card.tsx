'use client';

import Image from 'next/image';
import { Calendar, Edit, Eye, ImageIcon, Layers, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSafeDate } from '@/lib/utils';
import type { JournalArticle } from '@/types/catalogue.types';

interface JournalMobileCardProps {
  article: JournalArticle;
  isDeleting: boolean;
  onView: (article: JournalArticle) => void;
  onEdit: (article: JournalArticle) => void;
  onDelete: (article: JournalArticle) => void;
}

export function JournalMobileCard({
  article,
  isDeleting,
  onView,
  onEdit,
  onDelete
}: JournalMobileCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-2xs">
      <div className="relative aspect-[16/7] w-full bg-muted/40">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-md border border-white/20 bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          <Layers className="h-3 w-3 shrink-0" />
          <span className="truncate">{article.category}</span>
        </span>
      </div>

      <div className="space-y-3 p-3.5">
        <div className="space-y-1.5">
          <h2 className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground">
            {article.title}
          </h2>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1.5 border-y border-border/30 py-2 text-[11px] text-muted-foreground min-[380px]:grid-cols-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{article.author}</span>
          </span>
          <span className="flex items-center gap-1.5 min-[380px]:justify-end">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{formatSafeDate(article.date)}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onView(article)}
            className="h-9 gap-1.5 rounded-lg px-2 text-[11px]"
            aria-label={`Lihat detail artikel ${article.title}`}
          >
            <Eye className="h-3.5 w-3.5" />
            Detail
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(article)}
            className="h-9 gap-1.5 rounded-lg px-2 text-[11px]"
            aria-label={`Edit artikel ${article.title}`}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(article)}
            disabled={isDeleting}
            className="h-9 gap-1.5 rounded-lg px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Hapus artikel ${article.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        </div>
      </div>
    </article>
  );
}
