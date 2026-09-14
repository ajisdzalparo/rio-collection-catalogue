'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Calendar, Edit, Eye, ImageIcon, Layers, Trash2, User } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TruncatedText } from '@/components/ui/truncated-text';
import { formatSafeDate } from '@/lib/utils';
import type { JournalArticle } from '@/types/catalogue.types';
import { JournalMobileCard } from './journal-mobile-card';

interface JournalTableProps {
  articles: JournalArticle[];
  isLoading: boolean;
  isDeleting: boolean;
  onView: (article: JournalArticle) => void;
  onEdit: (article: JournalArticle) => void;
  onDelete: (article: JournalArticle) => void;
}

const categoryOptions = [
  ['ALL', 'Semua Topik'],
  ['PROSES KREATIF', 'Proses Kreatif'],
  ['CULTURE', 'Culture'],
  ['PROCESS', 'Process'],
  ['DESIGN', 'Design'],
  ['MATERIAL STUDY', 'Material Study']
] as const;

export function JournalTable({
  articles,
  isLoading,
  isDeleting,
  onView,
  onEdit,
  onDelete
}: JournalTableProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (article) => selectedCategory === 'ALL' || article.category === selectedCategory
      ),
    [articles, selectedCategory]
  );

  const columns: Column<JournalArticle>[] = useMemo(
    () => [
      {
        header: 'Foto Sampul',
        cell: (article) => (
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border/20 bg-muted/50">
            {article.imageUrl ? (
              <Image src={article.imageUrl} alt={article.title} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        )
      },
      {
        header: 'Judul Artikel',
        accessorKey: 'title',
        className: 'w-full min-w-[200px]',
        cell: (article) => (
          <TruncatedText text={article.title} maxWidth="max-w-[320px]" className="text-xs font-bold text-foreground" />
        )
      },
      {
        header: 'Topik / Kategori',
        accessorKey: 'category',
        cell: (article) => (
          <span className="inline-flex items-center gap-1 rounded-md border border-border/10 bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
            <Layers className="h-3 w-3 shrink-0" />
            <TruncatedText text={article.category} maxWidth="max-w-[120px]" />
          </span>
        )
      },
      {
        header: 'Penulis',
        accessorKey: 'author',
        cell: (article) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <TruncatedText text={article.author} maxWidth="max-w-[120px]" />
          </div>
        )
      },
      {
        header: 'Tanggal Rilis',
        accessorKey: 'date',
        cell: (article) => (
          <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatSafeDate(article.date)}</span>
          </div>
        )
      },
      {
        header: 'Ringkasan Excerpt',
        cell: (article) => (
          <TruncatedText text={article.excerpt} maxWidth="max-w-[320px]" className="text-xs font-normal text-muted-foreground" />
        )
      },
      {
        header: 'Aksi',
        className: 'text-right',
        sortable: false,
        cell: (article) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onView(article)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Lihat detail artikel ${article.title}`}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(article)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit artikel ${article.title}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(article)} disabled={isDeleting} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Hapus artikel ${article.title}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [isDeleting, onDelete, onEdit, onView]
  );

  return (
    <DataTable
      columns={columns}
      data={filteredArticles}
      isLoading={isLoading}
      searchKey="title"
      extraSearchKeys={['excerpt', 'author']}
      searchPlaceholder="Cari judul artikel, kutipan, penulis..."
      filterComponents={
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">Topik:</span>
          <Select value={selectedCategory} onValueChange={(value) => value && setSelectedCategory(value)}>
            <SelectTrigger className="h-9 min-w-0 flex-1 rounded-xl sm:w-45 sm:flex-none">
              <SelectValue placeholder="Semua Topik" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      emptyTitle="Artikel Tidak Ditemukan"
      emptyDescription="Tidak ada data artikel blog yang cocok dengan filter atau pencarian Anda."
      pageSize={10}
      getRowId={(article) => article.id}
      renderCard={(article) => (
        <JournalMobileCard article={article} isDeleting={isDeleting} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
