'use client';

import { Suspense, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { Flex, VStack } from '@/components/ui/layout';
import { useJournals } from '@/hooks/use-journals';
import type { JournalArticle } from '@/types/catalogue.types';
import { JournalDetailDialog } from './components/journal-detail-dialog';
import { JournalTable } from './components/journal-table';

function JournalCmsPageContent() {
  const router = useRouter();
  const { data: articles = [], isLoading, deleteJournal, isDeleting } = useJournals();
  const [detailArticle, setDetailArticle] = useState<JournalArticle | null>(null);
  const [deleteTargetArticle, setDeleteTargetArticle] = useState<JournalArticle | null>(null);

  const editArticle = (article: JournalArticle) => {
    setDetailArticle(null);
    router.push(`/dashboard/journal/editor?id=${article.id}`);
  };

  const confirmDeleteArticle = async () => {
    if (!deleteTargetArticle) return;
    try {
      await deleteJournal(deleteTargetArticle.id);
    } catch (error) {
      console.error('Failed to delete article:', error);
    } finally {
      setDeleteTargetArticle(null);
    }
  };

  return (
    <VStack gap="lg" className="pb-10">
      <Flex
        direction="responsive"
        justify="between"
        align="stretch"
        gap="md"
        className="sm:items-center"
      >
        <VStack gap="xs">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Blog CMS
          </h1>
          <p className="pt-1 text-sm text-muted-foreground">
            Tulis creative process, brand philosophy, dan artikel editorial RIO COLLECTION
          </p>
        </VStack>
        <Button
          onClick={() => router.push('/dashboard/journal/editor')}
          className="h-10 w-full gap-2 rounded-xl text-xs font-bold uppercase tracking-wider sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Artikel</span>
        </Button>
      </Flex>

      <JournalTable
        articles={articles}
        isLoading={isLoading}
        isDeleting={isDeleting}
        onView={setDetailArticle}
        onEdit={editArticle}
        onDelete={setDeleteTargetArticle}
      />

      <JournalDetailDialog
        article={detailArticle}
        onClose={() => setDetailArticle(null)}
        onEdit={editArticle}
      />

      <ConfirmModal
        open={Boolean(deleteTargetArticle)}
        onOpenChange={(open) => !open && setDeleteTargetArticle(null)}
        title="Konfirmasi Hapus Artikel Blog"
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
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <JournalCmsPageContent />
    </Suspense>
  );
}
