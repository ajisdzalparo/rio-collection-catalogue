import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getJournals } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Stories, ideas, and the work behind each drop. The RIO COLLECTION brand journal.',
  openGraph: {
    title: 'Journal — RIO COLLECTION',
    description: 'Stories, ideas, and the work behind each drop. The RIO COLLECTION brand journal.',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION Journal',
      },
    ],
  },
};

export default async function JournalPage() {
  const journals = await getJournals();

  if (journals.length === 0) {
    return (
      <div className="mx-auto max-w-350 px-4 md:px-16 py-32 text-center">
        <h1 className="font-eb-garamond text-[32px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface)">
          Journal
        </h1>
        <p className="mt-4 font-hanken text-[14px] text-(--cat-on-surface-variant)">
          Belum ada cerita yang dibagikan. Silakan tambahkan artikel dari CMS dashboard.
        </p>
      </div>
    );
  }

  const featuredArticle = journals[1] || journals[0]; // "Melihat di Balik Layar"
  const recentArticles = featuredArticle ? journals.filter((a) => a.id !== featuredArticle.id).slice(0, 3) : [];

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-12 md:pt-20 pb-8 md:pb-12 text-center">
        <h1 className="font-eb-garamond text-[40px] md:text-[64px] font-normal leading-tight text-(--cat-on-surface)">
          Journal
        </h1>
        <p className="mt-2 font-hanken text-[14px] md:text-[16px] text-(--cat-on-surface-variant)">
          Stories, ideas, and the work behind each drop.
        </p>
      </section>

      {/* Featured Article */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left: Text */}
          <div className="order-2 md:order-1">
            <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
              {featuredArticle.category}
            </span>
            <h2 className="mt-3 font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
              {featuredArticle.title}
            </h2>
            <p className="mt-4 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
              {featuredArticle.excerpt}
            </p>
            <div className="mt-6">
              <Link
                href={`/journal/${featuredArticle.slug}`}
                className="inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) border-b border-(--cat-on-surface) pb-0.5 hover:opacity-70 transition-opacity duration-150"
              >
                Baca Selengkapnya
                <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Right: Image */}
          <div className="order-1 md:order-2 relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
            <Image
              src={featuredArticle.imageUrl}
              alt={featuredArticle.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-350 px-4 md:px-16">
        <hr className="border-(--cat-stone)" />
      </div>

      {/* Recent Articles */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-12 md:py-20">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
            Artikel Terbaru
          </h2>
          <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
            Lihat Semua
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {recentArticles.map((article) => (
            <Link
              key={article.id}
              href={`/journal/${article.slug}`}
              className="group block"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
                    {article.category}
                  </span>
                  <span className="font-hanken text-[11px] text-(--cat-on-surface-variant)">
                    {article.date}
                  </span>
                </div>
                <h3 className="font-eb-garamond text-[20px] md:text-[22px] font-normal leading-snug text-(--cat-on-surface) group-hover:text-(--cat-on-surface-variant) transition-colors duration-150">
                  {article.title}
                </h3>
                <p className="mt-2 font-hanken text-[13px] leading-relaxed text-(--cat-on-surface-variant) line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
