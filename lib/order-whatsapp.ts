import { formatIDR } from '@/lib/utils';

export interface WhatsAppTemplates {
  waTemplatePending: string;
  waTemplatePayment: string;
  waTemplateShipping: string;
  waTemplateRemind: string;
}

export type WhatsAppMessageStage = 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'REMINDER';

export interface StoreBankLike {
  bankName: string;
  accountNumber: string;
  accountOwner: string;
  isActive?: boolean;
}

export function formatStoreBankDetails(
  storeBanks: StoreBankLike[] = [],
  storeSettings?: {
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountOwner?: string | null;
  }
): string {
  const activeBanks = storeBanks.filter((b) => b.isActive !== false);
  if (activeBanks.length > 0) {
    return activeBanks
      .map((b) => `${b.bankName}: ${b.accountNumber} a.n ${b.accountOwner}`)
      .join('\n');
  }

  if (storeSettings?.bankAccountNumber && storeSettings.bankAccountNumber !== '1234567890') {
    return `${storeSettings.bankName || 'Bank'}: ${storeSettings.bankAccountNumber} a.n ${storeSettings.bankAccountOwner || 'Toko'}`;
  }

  return '[⚠️ REKENING PEMBAYARAN BELUM DIATUR DI PENGATURAN TOKO]';
}

export interface OrderItemLike {
  name: string;
  quantity: number;
  size?: string | null;
}

export function formatOrderItems(
  items?: OrderItemLike[] | string | null
): string {
  if (!items) return '-';
  if (typeof items === 'string') return items;
  if (!Array.isArray(items) || items.length === 0) return '-';

  return items
    .map((item) => {
      const sizeStr = item.size ? ` (${item.size})` : '';
      return `• ${item.name}${sizeStr} x${item.quantity}`;
    })
    .join('\n');
}

export const DEFAULT_WA_TEMPLATES: WhatsAppTemplates = {
  waTemplatePending:
    'Halo {nama_pelanggan},\n\nTerima kasih telah memesan di RIO COLLECTION!\nKami telah menerima pesanan Anda dengan nomor #{nomor_order}.\n\nRincian Pesanan:\n{daftar_produk}\n\nTotal Tagihan: {total_pembayaran}\n\nSilakan lakukan pembayaran melalui rekening bank berikut:\n{rekening_bank}\n\nSetelah pembayaran, mohon kirimkan bukti transfer melalui WhatsApp ini. Terima kasih.',
  waTemplatePayment:
    'Halo {nama_pelanggan},\n\nPembayaran untuk pesanan #{nomor_order} sebesar {total_pembayaran} telah kami terima dan verifikasi.\n\nRincian:\n{daftar_produk}\n\nPesanan Anda sedang kami siapkan untuk pengiriman. Terima kasih telah berbelanja di RIO COLLECTION.',
  waTemplateShipping:
    'Halo {nama_pelanggan},\n\nPesanan #{nomor_order} telah dikirim.\nRincian: {daftar_produk}\nEkspedisi: {kurir}\nNomor resi: {nomor_resi}\n\nSilakan lacak paket melalui situs resmi ekspedisi. Terima kasih telah memilih RIO COLLECTION.',
  waTemplateRemind:
    'Halo {nama_pelanggan},\n\nKami ingin mengingatkan bahwa pembayaran pesanan #{nomor_order} sebesar {total_pembayaran} belum kami terima.\n\nRincian Pesanan:\n{daftar_produk}\n\nSilakan lakukan pembayaran melalui rekening bank berikut:\n{rekening_bank}\n\nApabila ada kendala saat melakukan pembayaran, silakan informasikan kepada kami. Terima kasih.'
};

interface BuildWhatsAppMessageInput {
  stage: WhatsAppMessageStage;
  templates: { [Key in keyof WhatsAppTemplates]?: string | null };
  customerName: string;
  orderNumber: string;
  totalPayment: number;
  bankDetails: string;
  items?: OrderItemLike[] | string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  storeName?: string | null;
}

const templateKeyByStage: Record<WhatsAppMessageStage, keyof WhatsAppTemplates> = {
  ORDER: 'waTemplatePending',
  PAYMENT: 'waTemplatePayment',
  SHIPPING: 'waTemplateShipping',
  REMINDER: 'waTemplateRemind'
};

export function buildWhatsAppMessage(input: BuildWhatsAppMessageInput): string {
  const templateKey = templateKeyByStage[input.stage];
  const template = input.templates[templateKey] || DEFAULT_WA_TEMPLATES[templateKey];

  const itemsText = formatOrderItems(input.items);
  const totalQty = Array.isArray(input.items)
    ? input.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 1;

  return template
    .replaceAll('{nama_pelanggan}', input.customerName)
    .replaceAll('{nama_toko}', input.storeName?.trim() || 'RIO COLLECTION')
    .replaceAll('{nomor_order}', input.orderNumber)
    .replaceAll('{daftar_produk}', itemsText)
    .replaceAll('{rincian_pesanan}', itemsText)
    .replaceAll('{daftar_item}', itemsText)
    .replaceAll('{item_name}', itemsText)
    .replaceAll('{items}', itemsText)
    .replaceAll('{total_qty}', String(totalQty))
    .replaceAll('{qty}', String(totalQty))
    .replaceAll('{total_pembayaran}', formatIDR(input.totalPayment))
    .replaceAll('{rekening_bank}', input.bankDetails || '[REKENING BANK]')
    .replaceAll('{kurir}', input.courierName?.trim() || '[KURIR]')
    .replaceAll('{nomor_resi}', input.trackingNumber?.trim() || '[NOMOR RESI]');
}
