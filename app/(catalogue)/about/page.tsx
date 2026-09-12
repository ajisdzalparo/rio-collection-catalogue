import type { Metadata } from 'next';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatWaNumber } from '@/lib/utils';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'About',
  description: 'Tentang kami — cerita brand dan filosofi di balik RIO COLLECTION.',
  openGraph: {
    title: 'About — RIO COLLECTION',
    description: 'Tentang kami — cerita brand dan filosofi di balik RIO COLLECTION.',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION About',
      },
    ],
  },
};

interface AboutValue {
  title: string;
  description: string;
}

export default async function AboutPage() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: 'default' } })
    .catch(() => null);

  const values = (
    Array.isArray(settings?.aboutValues) ? (settings?.aboutValues as unknown as AboutValue[]) : []
  ).filter((v) => v?.title);

  const heroImage = settings?.aboutHeroImage || '';
  const heading = settings?.aboutHeading || '';
  const paragraph1 = settings?.aboutParagraph1 || '';
  const paragraph2 = settings?.aboutParagraph2 || '';
  const valuesTitle = settings?.aboutValuesTitle || '';
  const quote = settings?.aboutQuote || '';
  const quoteText = settings?.aboutQuoteText || '';
  const studioImage = settings?.aboutStudioImage || '';
  const whatsappNumber = settings?.whatsappNumber || '';
  const contactEmail = settings?.contactEmail || '';

  return (
    <>
      {/* Hero — only rendered when CMS provides an image */}
      {heroImage && (
        <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
          <Image src={heroImage} alt={heading || 'About hero'} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-16 pb-12 md:pb-16">
            <div className="mx-auto max-w-350">
              <h1 className="font-eb-garamond text-[40px] md:text-[64px] font-normal leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
                {heading || 'About'}
              </h1>
            </div>
          </div>
        </section>
      )}

      {!heroImage && heading && (
        <section className="mx-auto max-w-350 px-4 md:px-16 pt-12 md:pt-20 pb-6">
          <h1 className="font-eb-garamond text-[40px] md:text-[64px] font-normal leading-tight text-(--cat-on-surface)">
            {heading}
          </h1>
        </section>
      )}

      {/* Manifesto paragraphs */}
      {(paragraph1 || paragraph2) && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            {heading && heroImage ? (
              <div className="md:col-span-5">
                <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
                  {heading}
                </h2>
              </div>
            ) : null}
            <div className={heading && heroImage ? 'md:col-span-7 flex flex-col justify-center' : 'md:col-span-12'}>
              {paragraph1 && (
                <p className="font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)">
                  {paragraph1}
                </p>
              )}
              {paragraph2 && (
                <p className="mt-6 font-hanken text-[16px] md:text-[17px] leading-[1.8] text-(--cat-on-surface-variant)">
                  {paragraph2}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Values — only rendered when CMS provides values */}
      {values.length > 0 && (
        <section className="bg-(--cat-surface-container-low)">
          <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
            {valuesTitle && (
              <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface) text-center mb-14 md:mb-20">
                {valuesTitle}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {values.map((value) => (
                <div key={value.title} className="text-center md:text-left">
                  <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-4">
                    {value.title}
                  </h3>
                  <p className="font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Studio quote + image */}
      {(quote || studioImage) && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {studioImage && (
              <div className="relative aspect-4/5 overflow-hidden bg-(--cat-surface-container-low)">
                <Image
                  src={studioImage}
                  alt={quote || 'Studio'}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
            {quote && (
              <div>
                <blockquote className="font-eb-garamond text-[24px] md:text-[32px] font-normal leading-snug text-(--cat-on-surface) italic">
                  &quot;{quote}&quot;
                </blockquote>
                {quoteText && (
                  <p className="mt-6 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
                    {quoteText}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact — driven by CMS store settings */}
      {(whatsappNumber || contactEmail) && (
        <section className="border-t border-(--cat-stone)">
          <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-20 text-center">
            <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
              Hubungi Kami
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${formatWaNumber(whatsappNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-hanken text-[14px] text-(--cat-on-surface) underline hover:opacity-70 transition-opacity"
                >
                  WhatsApp: +{formatWaNumber(whatsappNumber)}
                </a>
              )}
              {whatsappNumber && contactEmail && (
                <span className="hidden sm:inline text-(--cat-stone)">|</span>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-hanken text-[14px] text-(--cat-on-surface) underline hover:opacity-70 transition-opacity"
                >
                  {contactEmail}
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
