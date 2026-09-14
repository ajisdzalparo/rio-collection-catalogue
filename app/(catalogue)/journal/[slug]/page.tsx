import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJournals, getJournalBySlug, getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

// The catalogue layout reads request-time data via connection(). Keeping this
// route dynamic prevents a production DYNAMIC_SERVER_USAGE error when a slug is
// rendered on demand.
export const dynamic = 'force-dynamic';

interface JournalDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JournalDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getJournalBySlug(slug);
  if (!article) return { title: 'Article Not Found' };

  const seoTitle = article.seoTitle?.trim() || article.title;
  const seoDescription = article.seoDescription?.trim() || article.excerpt;
  const ogImage = article.ogImageUrl?.trim() || article.imageUrl;
  const parsedDate = Date.parse(article.date);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `/journal/${article.slug}`
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `/journal/${article.slug}`,
      type: 'article',
      ...(Number.isNaN(parsedDate) ? {} : { publishedTime: new Date(parsedDate).toISOString() }),
      authors: article.author ? [article.author] : [],
      images: ogImage ? [ogImage] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : []
    }
  };
}

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export default async function JournalDetailPage({ params }: JournalDetailProps) {
  const { slug } = await params;
  const [article, products, allJournals] = await Promise.all([
    getJournalBySlug(slug),
    getProducts(),
    getJournals()
  ]);

  if (!article) {
    notFound();
  }

  const relatedProduct = article.relatedProductSlug
    ? products.find((p) => p.slug === article.relatedProductSlug)
    : null;

  const relatedArticles = allJournals.filter((a) => a.id !== article.id).slice(0, 2);
  const seoDescription = article.seoDescription?.trim() || article.excerpt;
  const ogImage = article.ogImageUrl?.trim() || article.imageUrl;
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.seoTitle?.trim() || article.title,
    description: seoDescription,
    image: ogImage ? [ogImage] : undefined,
    author: {
      '@type': 'Person',
      name: article.author
    },
    datePublished: article.date,
    articleSection: article.category,
    url: `${siteUrl}/journal/${article.slug}`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-8 md:pt-12">
        {/* Breadcrumbs */}
        <nav
          className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/journal" className="hover:text-(--cat-on-surface) transition-colors">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-(--cat-on-surface) line-clamp-1">
            {article.title}
          </span>
        </nav>

        {/* Category & Date */}
        <div className="flex items-center gap-4 mb-2">
          <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) bg-(--cat-surface-container-low) px-2 py-1">
            {article.category}
          </span>
          <span className="font-hanken text-[12px] text-(--cat-on-surface-variant)">
            {article.date}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-eb-garamond text-[32px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface) max-w-3xl">
          {article.title}
        </h1>
        <p className="mt-2 font-hanken text-[14px] text-(--cat-on-surface-variant)">
          Oleh {article.author}
        </p>
      </section>

      {/* Hero Image */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-8">
        <div className="relative aspect-video md:aspect-[2.2/1] overflow-hidden bg-(--cat-surface-container-low)">
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
      <article className="mx-auto min-w-0 max-w-3xl overflow-hidden px-4 pb-16 md:px-8 md:pb-24">
        {article.contentHtml ? (
          <div
            className="font-hanken text-[16px] md:text-[18px] leading-[1.85] text-(--cat-on-surface-variant) [&_p]:mt-6 [&_p]:break-words [&_p:first-child]:mt-0 [&_h2]:font-eb-garamond [&_h2]:text-[28px] [&_h2]:md:text-[36px] [&_h2]:font-bold [&_h2]:text-(--cat-on-surface) [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h2]:break-words [&_h3]:font-eb-garamond [&_h3]:text-[22px] [&_h3]:md:text-[28px] [&_h3]:font-bold [&_h3]:text-(--cat-on-surface) [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:break-words [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-6 [&_ul_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-6 [&_ol_li]:mt-2 [&_blockquote]:my-10 [&_blockquote]:py-4 [&_blockquote]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-(--cat-stone) [&_blockquote]:italic [&_blockquote]:font-eb-garamond [&_blockquote]:text-[22px] [&_blockquote]:text-(--cat-on-surface) [&_hr]:my-12 [&_hr]:border-(--cat-stone) [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/30 [&_img]:my-8 [&_img]:shadow-sm [&_figure]:my-8 [&_figure]:max-w-full [&_figure]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:italic [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted [&_code]:text-xs [&_code]:font-mono [&_pre]:max-w-full [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:overflow-x-auto [&_pre]:my-6 [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium [&_a]:transition-opacity [&_a:hover]:opacity-80"
            // contentHtml is already sanitized at write time (journal-schema.ts)
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        ) : (
          <>
            {/* First two paragraphs */}
            {article.content.slice(0, 2).map((paragraph, i) => (
              <p
                key={i}
                className="mt-6 first:mt-0 font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)"
              >
                {paragraph}
              </p>
            ))}

            {/* Pull Quote */}
            {article.pullQuote && (
              <blockquote className="my-10 md:my-14 py-8 border-t border-b border-(--cat-stone)">
                <p className="font-eb-garamond text-[24px] md:text-[30px] font-normal leading-snug text-(--cat-on-surface) italic text-center max-w-xl mx-auto">
                  &quot;{article.pullQuote}&quot;
                </p>
              </blockquote>
            )}

            {/* Remaining paragraphs */}
            {article.content.slice(2).map((paragraph, i) => (
              <p
                key={i + 2}
                className="mt-6 font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)"
              >
                {paragraph}
              </p>
            ))}
          </>
        )}

        {/* Inline image */}
        <div className="my-10 md:my-14 relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
          <Image
            src={article.imageUrl}
            alt={`${article.title} — detail`}
            fill
            sizes="768px"
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-(--cat-surface)/80 px-4 py-2">
            <p className="font-hanken text-[10px] uppercase tracking-widest text-(--cat-on-surface-variant) text-center">
              Detail — {article.title}
            </p>
          </div>
        </div>
      </article>

      {/* Related Content */}
      <section className="border-t border-(--cat-stone)">
        <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            {/* Related Product */}
            {relatedProduct && (
              <div className="md:col-span-4">
                <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-6">
                  Melengkapi Cerita
                </h3>
                <Link href={`/products/${relatedProduct.slug}`} className="group block">
                  <div className="relative aspect-4/5 overflow-hidden bg-(--cat-surface-container-low)">
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
                      <p className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                        {relatedProduct.name}
                      </p>
                      <p className="text-[12px] text-(--cat-on-surface-variant) capitalize">
                        {relatedProduct.color} /{' '}
                        {relatedProduct.materialsAndCare?.fabric
                          ?.match(/\d+gsm/i)?.[0]
                          ?.toUpperCase() ||
                          (relatedProduct.category === 'heavy-weight'
                            ? '240GSM'
                            : relatedProduct.category === 'graphic-edition'
                              ? '180GSM'
                              : '200GSM')}
                      </p>
                    </div>
                    <p className="font-hanken text-[15px] font-medium text-(--cat-on-surface) tabular-nums">
                      {formatPrice(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Related Articles */}
            <div className={relatedProduct ? 'md:col-span-8' : 'md:col-span-12'}>
              <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-6">
                Artikel Terkait
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {relatedArticles.map((related) => (
                  <Link key={related.id} href={`/journal/${related.slug}`} className="group block">
                    <div className="relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
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
                        <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
                          {related.category}
                        </span>
                        <span className="font-hanken text-[11px] text-(--cat-on-surface-variant)">
                          {related.date}
                        </span>
                      </div>
                      <h4 className="font-eb-garamond text-[18px] md:text-[20px] font-normal leading-snug text-(--cat-on-surface)">
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
