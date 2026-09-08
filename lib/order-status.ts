const labels: Record<string, string> = {
  PENDING: 'Menunggu Konfirmasi',
  CONFIRMED: 'Pesanan Dikonfirmasi',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Pembayaran Diterima',
  FULFILLED: 'Pesanan Dikirim',
  CANCELLED: 'Pesanan Dibatalkan',
  REJECTED: 'Pesanan Ditolak',
  EXPIRED: 'Pesanan Kedaluwarsa'
};

export function getOrderStatusLabel(status: string): string {
  return labels[status] || 'Status Sedang Diperbarui';
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
