import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indonesian Rupiah (IDR).
 * Example: 450000 → "Rp 450.000"
 */
export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`;
}
