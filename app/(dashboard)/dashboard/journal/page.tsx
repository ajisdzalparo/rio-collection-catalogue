'use client';

import { useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Layers,
  Image as ImageIcon,
  Eye,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useJournals } from '@/hooks/use-journals';
import { Flex, VStack } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
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
import type { JournalArticle } from '@/types/catalogue.types';

function JournalCmsPageContent() {
  const router = useRouter();
  const { data: articles = [], isLoading: loading, deleteJournal, isDeleting } = useJournals();

  // Search & Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [detailArticle, setDetailArticle] = useState<JournalArticle | null>(null);
  const [deleteTargetArticle, setDeleteTargetArticle] = useState<JournalArticle | null>(null);

  const confirmDeleteArticle = async () => {
    if (!deleteTargetArticle) return;
    try {
      await deleteJournal(deleteTargetArticle.id);
    } catch (err) {
      console.error('Failed to delete article:', err);
    } finally {
      setDeleteTargetArticle(null);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
      return matchesCategory;
    });
  }, [articles, selectedCategory]);

  // Table Columns Definition for DataTable
  const columns: Column<JournalArticle>[] = useMemo(
    () => [
      {
        header: 'Foto Sampul',
        cell: (article) => (
          <div className="relative h-12 w-16 overflow-hidden bg-muted/50 border border-border/20 rounded-md shrink-0">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="60px"
                className="object-cover"
              />
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
        sortable: true,
        className: 'w-full min-w-[200px]',
        cell: (article) => (
          <TruncatedText
            text={article.title}
            maxWidth="max-w-[260px]"
            className="font-bold text-xs text-foreground"
          />
        )
      },
      {
        header: 'Topik / Kategori',
        accessorKey: 'category',
        sortable: true,
        cell: (article) => (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
            <Layers className="h-3 w-3 shrink-0" />
            <TruncatedText text={article.category} maxWidth="max-w-[120px]" />
          </span>
        )
      },
      {
        header: 'Penulis',
        accessorKey: 'author',
        sortable: true,
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
        sortable: true,
        cell: (article) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {new Date(article.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )
      },
      {
        header: 'Ringkasan Excerpt',
        cell: (article) => (
          <TruncatedText
            text={article.excerpt}
            maxWidth="max-w-[280px]"
            className="text-xs text-muted-foreground font-normal"
          />
        )
      },
      {
        header: 'Aksi',
        className: 'text-right',
        cell: (article) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetailArticle(article)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/journal/editor?id=${article.id}`)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Edit Artikel"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTargetArticle(article)}
              disabled={isDeleting}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Hapus Artikel"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [isDeleting, router]
  );

  return (
    <VStack gap="lg" className="pb-10">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Journal CMS</h1>
          <p className="text-sm text-muted-foreground pt-1">
            Tulis creative process, brand philosophy, dan artikel editorial RIO COLLECTION
          </p>
        </VStack>
        <Button
          onClick={() => router.push('/dashboard/journal/editor')}
          className="gap-2 h-10 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Artikel</span>
        </Button>
      </Flex>

      {/* Journal DataTable */}
      <DataTable
        columns={columns}
        data={filteredArticles}
        isLoading={loading}
        searchKey="title"
        searchPlaceholder="Cari judul artikel, kutipan, penulis..."
        filterComponents={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Topik:
            </span>
            <Select
              value={selectedCategory}
              onValueChange={(val) => val && setSelectedCategory(val)}
            >
              <SelectTrigger className="w-45 h-9 rounded-xl">
                <SelectValue placeholder="Semua Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Topik</SelectItem>
                <SelectItem value="PROSES KREATIF">Proses Kreatif</SelectItem>
                <SelectItem value="CULTURE">Culture</SelectItem>
                <SelectItem value="PROCESS">Process</SelectItem>
                <SelectItem value="DESIGN">Design</SelectItem>
                <SelectItem value="MATERIAL STUDY">Material Study</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="Artikel Tidak Ditemukan"
        emptyDescription="Tidak ada data artikel jurnal yang cocok dengan filter atau pencarian Anda."
        pageSize={10}
      />

      {/* Read-Only Article Detail Dialog */}
      <Dialog
        open={detailArticle !== null}
        onOpenChange={(open) => {
          if (!open) setDetailArticle(null);
        }}
      >
        {detailArticle && (
          <DialogContent className="sm:max-w-2xl bg-card border-border/40 rounded-2xl">
            <DialogHeader className="border-b border-border/20 pb-4">
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="line-clamp-1">{detailArticle.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs pt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
                  {detailArticle.category}
                </span>
                &middot;
                {new Date(detailArticle.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Meta */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Informasi Artikel
                  </h4>
                  <div className="bg-muted/15 p-4 rounded-xl border border-border/20 space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Penulis
                      </span>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <p className="text-sm font-bold text-foreground">{detailArticle.author}</p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Tanggal Rilis
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <p className="text-sm font-bold text-foreground">
                          {new Date(detailArticle.date).toLocaleDateString('id-ID', {
                            dateStyle: 'long'
                          })}
                        </p>
                      </div>
                    </div>
                    {detailArticle.slug && (
                      <div className="space-y-0.5 pt-1 border-t border-border/15">
                        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                          Slug
                        </span>
                        <p className="text-xs font-mono text-foreground/70">{detailArticle.slug}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Cover */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Cover Foto
                  </h4>
                  {detailArticle.imageUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/20 bg-muted/20">
                      <Image
                        src={detailArticle.imageUrl}
                        alt={detailArticle.title}
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border/20 bg-muted/10">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              {detailArticle.excerpt && (
                <div className="space-y-1.5 pt-3 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-bold">
                    Ringkasan / Excerpt
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {detailArticle.excerpt}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/20 pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setDetailArticle(null)}
                className="h-10 rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  const id = detailArticle.id;
                  setDetailArticle(null);
                  router.push(`/dashboard/journal/editor?id=${id}`);
                }}
                className="h-10 rounded-xl text-xs cursor-pointer gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Artikel
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTargetArticle)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetArticle(null);
        }}
        title="Konfirmasi Hapus Artikel Jurnal"
        description={
          deleteTargetArticle
            ? `Apakah Anda yakin ingin menghapus artikel "${deleteTargetArticle.title}" dari CMS?`
            : ''
        }
        confirmText="Hapus Artikel"
        cancelText="Batal"
        variant="destructive"
        loading={isDeleting}
        onConfirm={confirmDeleteArticle}
      />
    </VStack>
  );
}

export default function JournalCmsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading journal panel...</p>
        </div>
      }
    >
      <JournalCmsPageContent />
    </Suspense>
  );
}
