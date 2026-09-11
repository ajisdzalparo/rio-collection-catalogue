import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

export const formatPrice = formatIDR;

export function formatWaNumber(raw: string): string {
  let digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`;
  }
  return digits.replace(/^62{2,}/, '62');
}

export function formatSafeDate(
  rawDate: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  if (!rawDate) return '-';
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? '-' : rawDate.toLocaleDateString('id-ID', options);
  }

  // Try direct parsing (e.g. ISO format or standard date strings)
  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('id-ID', options);
  }

  // Indonesian month name mapping for strings like "12 Oktober 2024"
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

  const lower = rawDate.toLowerCase();
  let normalized = rawDate;
  for (const [idMonth, enMonth] of Object.entries(indonesianMonths)) {
    if (lower.includes(idMonth)) {
      normalized = lower.replace(idMonth, enMonth);
      break;
    }
  }

  const reParsed = new Date(normalized);
  if (!isNaN(reParsed.getTime())) {
    return reParsed.toLocaleDateString('id-ID', options);
  }

  // Fallback: If parsing fails, return original string safely instead of "Invalid Date"
  return rawDate;
}
