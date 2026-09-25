export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Sudah Dibayar',
  FULFILLED: 'Pesanan Dikirim',
  CANCELLED: 'Pesanan Dibatalkan',
  REJECTED: 'Pesanan Ditolak',
  EXPIRED: 'Kedaluwarsa'
};

export const ORDER_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'PENDING', label: 'Menunggu Konfirmasi' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAID', label: 'Sudah Dibayar' },
  { value: 'FULFILLED', label: 'Pesanan Dikirim' },
  { value: 'REJECTED', label: 'Pesanan Ditolak' },
  { value: 'CANCELLED', label: 'Pesanan Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' }
];

export function getOrderStatusLabel(status: string): string {
  const normalized = (status || '').toUpperCase();
  return ORDER_STATUS_LABELS[normalized] || normalized.replace(/_/g, ' ') || 'Status Sedang Diperbarui';
}

export function getOrderStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING': return 'Pesanan Anda telah diterima. Tim kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi.';
    case 'CONFIRMED':
    case 'WAITING_PAYMENT': return 'Silakan melakukan pembayaran sesuai instruksi toko dan kirim bukti transfer melalui WhatsApp.';
    case 'PAID': return 'Pembayaran telah diterima. Tim kami sedang menyiapkan pengiriman pesanan Anda.';
    case 'FULFILLED': return 'Pesanan Anda telah dikirim. Gunakan nomor resi di bawah untuk melacak pengiriman.';
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED': return 'Pesanan ini sudah tidak aktif. Hubungi toko jika Anda memerlukan bantuan.';
    default: return 'Hubungi toko untuk informasi status pesanan Anda.';
  }
}
