import { cn } from '@/lib/utils';
import { HeroCarousel } from '@/components/catalogue/hero-carousel';
import type { StoreSettings } from '@/hooks/use-store-settings';
import type { Product } from '@/types/catalogue.types';
import type { HeroSlide } from '@/types/store-settings.types';

interface HeroSectionProps {
  settings?: (Partial<Omit<StoreSettings, 'heroSlides'>> & { heroSlides?: unknown }) | null;
  comingSoonProduct?: Product | null;
  className?: string;
}

function isHeroSlide(value: unknown): value is HeroSlide {
  if (!value || typeof value !== 'object') return false;
  const slide = value as Partial<HeroSlide>;
  return (
    typeof slide.id === 'string' &&
    typeof slide.imageUrl === 'string' &&
    typeof slide.altText === 'string' &&
    typeof slide.isActive === 'boolean'
  );
}

function getLegacySlides(settings: Partial<Omit<StoreSettings, 'heroSlides'>>): HeroSlide[] {
  const legacyImages = [
    settings.heroLeftImage,
    settings.heroCenterImage,
    settings.heroRightImage
  ].filter((image): image is string => Boolean(image));

  return legacyImages.map((imageUrl, index) => ({
    id: `legacy-hero-${index + 1}`,
    imageUrl,
    altText: settings.heroTitle || 'Editorial campaign',
    title: settings.heroTitle || undefined,
    subtitle: settings.heroSubtitle || undefined,
    ctaText: settings.heroCtaText || undefined,
    ctaLink: settings.heroCtaLink || undefined,
    isActive: true
  }));
}

function getComingSoonSlide(product: Product): HeroSlide {
  return {
    id: `coming-soon-${product.id}`,
    imageUrl: product.imageUrl,
    altText: `${product.name} — Coming Soon`,
    title: product.name,
    subtitle: product.edition || 'Coming Soon',
    ctaText: 'Lihat Produk',
    ctaLink: `/products/${product.slug}`,
    isActive: true
  };
}

export function HeroSection({ settings, comingSoonProduct, className }: HeroSectionProps) {
  const configuredSlides = (Array.isArray(settings?.heroSlides) ? settings.heroSlides : []).filter(
    isHeroSlide
  ).filter((slide) => slide.isActive);
  const slides = comingSoonProduct
    ? [getComingSoonSlide(comingSoonProduct)]
    : configuredSlides.length > 0
      ? configuredSlides
      : getLegacySlides(settings || {});

  return (
    <section className={cn('relative w-full overflow-hidden', className)} aria-label="Hero Section">
      <HeroCarousel slides={slides} comingSoonProduct={comingSoonProduct} />
    </section>
  );
}
