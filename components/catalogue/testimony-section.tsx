import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';
import type { Testimony } from '@/types/catalogue.types';

interface TestimonySectionProps {
  testimonies: Testimony[];
}

export function TestimonySection({ testimonies }: TestimonySectionProps) {
  if (!testimonies || testimonies.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1400px] py-16 md:py-24 border-t border-(--cat-stone)/50 bg-(--cat-surface-bright)">
      {/* Header */}
      <div className="text-center mb-6 px-4">
        <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
          Bukti Percakapan Pelanggan
        </h2>
        <p className="mt-2 font-hanken text-[13px] md:text-[14px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
          Tangkapan Layar Hubungan WhatsApp Nyata Bersama Client
        </p>
      </div>

      {/* Stagger Stacked Screenshots Deck */}
      <StaggerTestimonials />
    </section>
  );
}
