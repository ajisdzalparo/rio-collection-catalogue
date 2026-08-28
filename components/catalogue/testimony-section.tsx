import Image from 'next/image';
import type { Testimony } from '@/types/catalogue.types';

interface TestimonySectionProps {
  testimonies: Testimony[];
}

export function TestimonySection({ testimonies }: TestimonySectionProps) {
  if (!testimonies || testimonies.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-16 py-16 md:py-24 border-t border-[var(--cat-stone)]/50 bg-[var(--cat-surface-bright)]">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="font-[family-name:var(--font-eb-garamond)] text-[28px] md:text-[40px] font-normal leading-tight text-[var(--cat-on-surface)]">
          Bukti Percakapan Pelanggan
        </h2>
        <p className="mt-2 font-[family-name:var(--font-hanken)] text-[13px] md:text-[14px] uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]">
          Tangkapan Layar Hubungan WhatsApp Nyata Bersama Client
        </p>
      </div>

      {/* Grid of Screenshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {testimonies.map((t) => (
          <div
            key={t.id}
            className="w-full max-w-[340px] bg-[var(--cat-surface-container-lowest)] border border-[var(--cat-stone)]/40 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow duration-300 relative group"
          >
            {/* Aspect Ratio for WhatsApp Chat Screenshots */}
            <div className="relative aspect-[9/16] w-full bg-[#e5ddd5]/30">
              <Image
                src={t.imageUrl}
                alt={t.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                priority
              />
            </div>

            {/* Badge overlay */}
            <div className="absolute top-3 right-3 bg-[var(--cat-charcoal)]/80 backdrop-blur-xs text-white px-3 py-1 text-[10px] font-[family-name:var(--font-hanken)] font-medium uppercase tracking-[0.08em] rounded-sm">
              Verified Chat
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
