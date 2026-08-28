import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJournals, getJournalBySlug, getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface JournalDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JournalDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getJournalBySlug(slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — RIO COLLECTION Journal`,
      description: article.excerpt,
      images: [article.imageUrl],
    },
  };
}

export async function generateStaticParams() {
  const journals = await getJournals();
  return journals.map((article) => ({
    slug: article.slug,
  }));
}

export default async function JournalDetailPage({ params }: JournalDetailProps) {
  const { slug } = await params;
  const [article, products, allJournals] = await Promise.all([
    getJournalBySlug(slug),
    getProducts(),
    getJournals(),
  ]);

  if (!article) {
    notFound();
  }

  const relatedProduct = article.relatedProductSlug
    ? products.find((p) => p.slug === article.relatedProductSlug)
    : null;

  const relatedArticles = allJournals
    .filter((a) => a.id !== article.id)
    .slice(0, 2);

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-16 pt-8 md:pt-12">
        {/* Breadcrumbs */}
        <nav
          className="mb-4 font-[family-name:var(--font-hanken)] text-[11px] uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[var(--cat-on-surface)] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/journal" className="hover:text-[var(--cat-on-surface)] transition-colors">Journal</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--cat-on-surface)] font-semibold">{article.title}</span>
        </nav>

        {/* Category & Date */}
        <div className="flex items-center gap-4 mb-2">
          <span className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] bg-[var(--cat-surface-container-low)] px-2 py-1">
            {article.category}
          </span>
          <span className="font-[family-name:var(--font-hanken)] text-[12px] text-[var(--cat-on-surface-variant)]">
            {article.date}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-eb-garamond)] text-[32px] md:text-[48px] font-normal leading-tight text-[var(--cat-on-surface)] max-w-3xl">
          {article.title}
        </h1>
        <p className="mt-2 font-[family-name:var(--font-hanken)] text-[14px] text-[var(--cat-on-surface-variant)]">
          Oleh {article.author}
        </p>
      </section>

      {/* Hero Image */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-16 py-8">
        <div className="relative aspect-[16/9] md:aspect-[2.2/1] overflow-hidden bg-[var(--cat-surface-container-low)]">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Article Content */}
      <article className="mx-auto max-w-[768px] px-4 md:px-8 pb-16 md:pb-24">
        {/* First two paragraphs */}
        {article.content.slice(0, 2).map((paragraph, i) => (
          <p
            key={i}
            className="mt-6 first:mt-0 font-[family-name:var(--font-hanken)] text-[16px] md:text-[17px] leading-[1.8] text-[var(--cat-on-surface-variant)]"
          >
            {paragraph}
          </p>
        ))}

        {/* Pull Quote */}
        {article.pullQuote && (
          <blockquote className="my-10 md:my-14 py-8 border-t border-b border-[var(--cat-stone)]">
            <p className="font-[family-name:var(--font-eb-garamond)] text-[24px] md:text-[30px] font-normal leading-snug text-[var(--cat-on-surface)] italic text-center max-w-xl mx-auto">
              &quot;{article.pullQuote}&quot;
            </p>
          </blockquote>
        )}

        {/* Remaining paragraphs */}
        {article.content.slice(2).map((paragraph, i) => (
          <p
            key={i + 2}
            className="mt-6 font-[family-name:var(--font-hanken)] text-[16px] md:text-[17px] leading-[1.8] text-[var(--cat-on-surface-variant)]"
          >
            {paragraph}
          </p>
        ))}

        {/* Inline image */}
        <div className="my-10 md:my-14 relative aspect-[4/3] overflow-hidden bg-[var(--cat-surface-container-low)]">
          <Image
            src={article.imageUrl}
            alt={`${article.title} — detail`}
            fill
            sizes="768px"
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--cat-surface)]/80 px-4 py-2">
            <p className="font-[family-name:var(--font-hanken)] text-[10px] uppercase tracking-[0.1em] text-[var(--cat-on-surface-variant)] text-center">
              Detail Tekstur — Katun 240gsm, Garment Washed
            </p>
          </div>
        </div>
      </article>

      {/* Related Content */}
      <section className="border-t border-[var(--cat-stone)]">
        <div className="mx-auto max-w-[1400px] px-4 md:px-16 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            {/* Related Product */}
            {relatedProduct && (
              <div className="md:col-span-4">
                <h3 className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-6">
                  Melengkapi Cerita
                </h3>
                <Link href={`/products/${relatedProduct.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--cat-surface-container-low)]">
                    <Image
                      src={relatedProduct.imageUrl}
                      alt={relatedProduct.name}
                      fill
                      sizes="33vw"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-[family-name:var(--font-hanken)] text-[15px] font-medium text-[var(--cat-on-surface)]">
                        {relatedProduct.name}
                      </p>
                      <p className="text-[12px] text-[var(--cat-on-surface-variant)]">
                        {relatedProduct.color} / 240GSM
                      </p>
                    </div>
                    <p className="font-[family-name:var(--font-hanken)] text-[15px] font-medium text-[var(--cat-on-surface)] tabular-nums">
                      {formatPrice(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Related Articles */}
            <div className={relatedProduct ? 'md:col-span-8' : 'md:col-span-12'}>
              <h3 className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-6">
                Artikel Terkait
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/journal/${related.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--cat-surface-container-low)]">
                      <Image
                        src={related.imageUrl}
                        alt={related.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]">
                          {related.category}
                        </span>
                        <span className="font-[family-name:var(--font-hanken)] text-[11px] text-[var(--cat-on-surface-variant)]">
                          {related.date}
                        </span>
                      </div>
                      <h4 className="font-[family-name:var(--font-eb-garamond)] text-[18px] md:text-[20px] font-normal leading-snug text-[var(--cat-on-surface)]">
                        {related.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
