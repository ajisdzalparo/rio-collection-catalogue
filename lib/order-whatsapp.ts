import { formatIDR } from '@/lib/utils';

export interface WhatsAppTemplates {
  waTemplatePending: string;
  waTemplatePayment: string;
  waTemplateShipping: string;
  waTemplateRemind: string;
}

export type WhatsAppMessageStage = 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'REMINDER';

export const DEFAULT_WA_TEMPLATES: WhatsAppTemplates = {
  waTemplatePending:
    'Halo {nama_pelanggan},\n\nTerima kasih telah memesan di RIO COLLECTION.\nNomor pesanan: #{nomor_order}\nTotal tagihan: {total_pembayaran}\n\nSilakan lakukan pembayaran ke rekening berikut:\n{rekening_bank}\n\nSetelah pembayaran, mohon kirimkan bukti transfer melalui WhatsApp ini. Terima kasih.',
  waTemplatePayment:
    'Halo {nama_pelanggan},\n\nPembayaran untuk pesanan #{nomor_order} sebesar {total_pembayaran} telah kami terima dan verifikasi.\n\nPesanan Anda sedang kami siapkan untuk pengiriman. Terima kasih telah berbelanja di RIO COLLECTION.',
  waTemplateShipping:
    'Halo {nama_pelanggan},\n\nPesanan #{nomor_order} telah dikirim.\nEkspedisi: {kurir}\nNomor resi: {nomor_resi}\n\nSilakan lacak paket melalui situs resmi ekspedisi. Terima kasih telah memilih RIO COLLECTION.',
  waTemplateRemind:
    'Halo {nama_pelanggan},\n\nKami ingin mengingatkan bahwa pembayaran pesanan #{nomor_order} sebesar {total_pembayaran} belum kami terima.\n\nApabila ada kendala saat melakukan pembayaran, silakan informasikan kepada kami. Terima kasih.'
};

interface BuildWhatsAppMessageInput {
  stage: WhatsAppMessageStage;
  templates: { [Key in keyof WhatsAppTemplates]?: string | null };
  customerName: string;
  orderNumber: string;
  totalPayment: number;
  bankDetails: string;
  courierName?: string | null;
  trackingNumber?: string | null;
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

  return template
    .replaceAll('{nama_pelanggan}', input.customerName)
    .replaceAll('{nomor_order}', input.orderNumber)
    .replaceAll('{total_pembayaran}', formatIDR(input.totalPayment))
    .replaceAll('{rekening_bank}', input.bankDetails)
    .replaceAll('{kurir}', input.courierName?.trim() || '-')
    .replaceAll('{nomor_resi}', input.trackingNumber?.trim() || '-');
}
