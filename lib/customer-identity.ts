export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
}
