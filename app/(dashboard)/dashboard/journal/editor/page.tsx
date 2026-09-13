'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Calendar,
  User,
  Layers,
  Image as ImageIcon,
  Quote as QuoteIcon,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VStack } from '@/components/ui/layout';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { ImageUpload } from '@/components/shared/image-upload';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { useJournals } from '@/hooks/use-journals';
import { useProducts } from '@/hooks/use-products';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import type { DatePickerPreset } from '@/types/date-picker.types';
import type { JournalArticle, JournalCategory } from '@/types/catalogue.types';
import { cn } from '@/lib/utils';

const JOURNAL_DATE_PRESETS: DatePickerPreset[] = [
  {
    label: 'Hari Ini',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: 'Kemarin',
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: '7 Hari Lalu',
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d, to: d };
    }
  }
];

function JournalEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');
  const { user } = useAuth();
  const loggedInAuthor = user?.name?.trim() || 'RIO COLLECTION';

  const {
    data: articles = [],
    isLoading,
    createJournal,
    updateJournal,
    isCreating,
    isUpdating
  } = useJournals();
  const { data: products = [] } = useProducts();

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<JournalCategory>('PROSES KREATIF');
  const [date, setDate] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [pullQuote, setPullQuote] = useState('');
  const [relatedProductSlug, setRelatedProductSlug] = useState('');

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;

    const indonesianMonths: Record<string, string> = {
      januari: 'January',
      februari: 'February',
      maret: 'March',
      april: 'April',
      mei: 'May',
      juni: 'June',
      juli: 'July',
      agustus: 'August',
      september: 'September',
      oktober: 'October',
      nopember: 'November',
      november: 'November',
      desember: 'December'
    };

    const lower = date.toLowerCase();
    let normalized = date;
    for (const [idMonth, enMonth] of Object.entries(indonesianMonths)) {
      if (lower.includes(idMonth)) {
        normalized = lower.replace(idMonth, enMonth);
        break;
      }
    }

    const reParsed = new Date(normalized);
    return !isNaN(reParsed.getTime()) ? reParsed : undefined;
  }, [date]);

  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    if (articleId && articles.length > 0) {
      const existing = articles.find((a) => a.id === articleId);
      if (existing) {
        setInitialized(true);
        setTitle(existing.title);
        setExcerpt(existing.excerpt);
        setCategory(existing.category);
        setDate(existing.date);
        setAuthor(existing.author);
        setImageUrl(existing.imageUrl);
        setPullQuote(existing.pullQuote || '');
        setRelatedProductSlug(existing.relatedProductSlug || '');

        // Use contentHtml if available, fallback to joining content paragraphs
        if (existing.contentHtml) {
          setContentHtml(existing.contentHtml);
        } else if (existing.content?.length) {
          setContentHtml(existing.content.map((p) => `<p>${p}</p>`).join(''));
        }
      }
    } else if (!articleId) {
      // New article — set defaults
      setInitialized(true);
      setDate(new Date().toISOString().split('T')[0]);
      setImageUrl('');
    }
  }

  const effectiveAuthor = articleId ? author : loggedInAuthor;

  const getSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  // Extract plain-text paragraphs from HTML for backward-compatible `content` field
  const htmlToParagraphs = (html: string): string[] => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const blocks = div.querySelectorAll('p, h2, h3, li, blockquote');
    if (blocks.length === 0) {
      // Fallback: split by <br> or newlines
      return (
        div.textContent
          ?.split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean) || []
      );
    }
    return Array.from(blocks)
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);
  };

  const handleSave = async () => {
    const slug = getSlug(title);
    const paragraphs = htmlToParagraphs(contentHtml);

    const payload: JournalArticle = {
      id: articleId || `art-${Date.now()}`,
      title,
      slug,
      excerpt,
      category,
      date,
      author: effectiveAuthor,
      imageUrl,
      content: paragraphs,
      contentHtml,
      pullQuote: pullQuote || undefined,
      relatedProductSlug: relatedProductSlug || undefined
    };

    try {
      if (articleId) {
        await updateJournal(payload);
      } else {
        await createJournal(payload);
      }
      router.push('/dashboard/journal');
    } catch (err) {
      console.error('Failed to save article:', err);
    }
  };

  const isEditing = !!articleId;
  const isSaving = isCreating || isUpdating;
  const canSave = title.trim() && excerpt.trim() && contentHtml.trim();

  if (isLoading && articleId) {
    return <CmsPageSkeleton variant="form" />;
  }

  return (
    <VStack gap="lg" className="pb-10 animate-in fade-in duration-300">
      {/* Header Container */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border/20">
        <div className="flex items-start gap-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/journal')}
            className="h-9 w-9 rounded-xl cursor-pointer shrink-0"
            title="Kembali ke Daftar Journal"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h1>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {isEditing
                ? 'Perbarui konten, kutipan, dan metadata artikel yang sudah ada di katalog.'
                : 'Buat editorial story, creative process notes, atau brand philosophy baru.'}
            </p>
          </div>
        </div>

        {/* Action Buttons on the Right */}
        <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
          <button
            onClick={() => router.push('/dashboard/journal')}
            className="h-10 px-4 rounded-xl text-xs font-bold border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer bg-card"
          >
            Batal
          </button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={cn(
              'gap-2 h-10 px-5 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs shadow-md transition-all duration-200',
              canSave && !isSaving
                ? 'bg-foreground text-background hover:bg-foreground/90 hover:shadow-lg hover:scale-[1.01]'
                : 'bg-muted text-muted-foreground border border-border/40'
            )}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </Button>
        </div>
      </div>

      {/* Two-column layout: Metadata + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left: Metadata panel */}
        <div className="space-y-5 order-2 lg:order-1">
          {/* Metadata Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4.5 shadow-2xs hover:shadow-xs transition-shadow duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/20 pb-2">
              <Layers className="h-4 w-4 text-muted-foreground/75" />
              Metadata Artikel
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="art-title" className="text-xs font-bold text-foreground">
                Judul Artikel
              </Label>
              <Input
                id="art-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Mencari Proporsi Siluet Boxy"
                className="h-10 rounded-xl bg-muted/20 border-border/55 focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="art-excerpt" className="text-xs font-bold text-foreground">
                Ringkasan / Excerpt
              </Label>
              <Textarea
                id="art-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan pendek 1-2 kalimat untuk kartu depan..."
                className="min-h-20 rounded-xl text-xs bg-muted/20 border-border/55 focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20 leading-normal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground/70" /> Topik
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => val && setCategory(val as JournalCategory)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-border/55 text-xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROSES KREATIF">Proses Kreatif</SelectItem>
                    <SelectItem value="CULTURE">Culture</SelectItem>
                    <SelectItem value="PROCESS">Process</SelectItem>
                    <SelectItem value="DESIGN">Design</SelectItem>
                    <SelectItem value="MATERIAL STUDY">Material Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="art-author"
                  className="text-xs font-bold text-foreground flex items-center gap-1"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground/70" /> Penulis
                </Label>
                <Select
                  value={effectiveAuthor}
                  onValueChange={(val) => setAuthor(val || loggedInAuthor)}
                  disabled={!articleId}
                >
                  <SelectTrigger
                    id="art-author"
                    className="h-10 rounded-xl bg-muted/20 border-border/55 text-xs"
                  >
                    <SelectValue placeholder="Pilih Penulis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={loggedInAuthor}>{loggedInAuthor}</SelectItem>
                    <SelectItem value="EDITORIAL TEAM">Editorial Team</SelectItem>
                    <SelectItem value="CREATIVE DIRECTION">Creative Direction</SelectItem>
                    <SelectItem value="DESIGN STUDIO">Design Studio</SelectItem>
                    {![
                      loggedInAuthor,
                      'EDITORIAL TEAM',
                      'CREATIVE DIRECTION',
                      'DESIGN STUDIO'
                    ].includes(author) &&
                      author && <SelectItem value={author}>{author}</SelectItem>}
                  </SelectContent>
                </Select>
                {!articleId && (
                  <p className="text-[10px] text-muted-foreground">
                    Otomatis mengikuti akun yang sedang login.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" /> Tanggal Rilis
                </Label>
                <DatePicker
                  mode="single"
                  value={selectedDate}
                  onChange={(newDate) => {
                    if (newDate) {
                      const y = newDate.getFullYear();
                      const m = String(newDate.getMonth() + 1).padStart(2, '0');
                      const d = String(newDate.getDate()).padStart(2, '0');
                      setDate(`${y}-${m}-${d}`);
                    } else {
                      setDate('');
                    }
                  }}
                  showPresets={true}
                  presets={JOURNAL_DATE_PRESETS}
                  placeholder="dd/mm/yyyy"
                  format="dd/MM/yyyy"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="art-relproduct"
                  className="text-xs font-bold text-foreground flex items-center gap-1"
                >
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground/70" /> Produk Terkait
                </Label>
                <Select
                  value={relatedProductSlug || 'none'}
                  onValueChange={(val) => setRelatedProductSlug(!val || val === 'none' ? '' : val)}
                >
                  <SelectTrigger
                    id="art-relproduct"
                    className="h-10 rounded-xl bg-muted/20 border-border/55 text-xs"
                  >
                    <SelectValue placeholder="Pilih Produk Terkait" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Produk</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.slug}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Media & Quote Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4.5 shadow-2xs hover:shadow-xs transition-shadow duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/20 pb-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground/75" />
              Media & Kutipan
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="art-img" className="text-xs font-bold text-foreground">
                Cover Foto
              </Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Drop cover foto di sini atau klik untuk upload"
                aspectRatio="16:9"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="art-quote"
                className="text-xs font-bold text-foreground flex items-center gap-1"
              >
                <QuoteIcon className="h-3.5 w-3.5 text-muted-foreground/70" /> Pull Quote (Opsional)
              </Label>
              <Input
                id="art-quote"
                type="text"
                value={pullQuote}
                onChange={(e) => setPullQuote(e.target.value)}
                placeholder="Kutipan menonjol di tengah artikel..."
                className="h-10 rounded-xl bg-muted/20 border-border/55"
              />
            </div>
          </div>
        </div>

        {/* Right: Rich Text Editor */}
        <div className="space-y-3 order-1 lg:order-2 flex flex-col">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground/90">
              <BookOpen className="h-4 w-4 text-muted-foreground/70" />
              Isi Konten Artikel
            </Label>
            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
              {contentHtml ? 'Terakhir diketik beberapa saat lalu' : 'Draft Kosong'}
            </span>
          </div>
          <RichTextEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Mulai menulis isi artikel di sini... Gunakan toolbar di atas untuk memformat teks."
            minHeight="560px"
          />
        </div>
      </div>
    </VStack>
  );
}

export default function JournalEditorPage() {
  return (
    <Suspense
      fallback={<CmsPageSkeleton variant="form" />}
    >
      <JournalEditorContent />
    </Suspense>
  );
}
