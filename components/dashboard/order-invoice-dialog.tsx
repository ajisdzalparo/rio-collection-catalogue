'use client';

import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  Bluetooth,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ReceiptText,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { generateBarcodeSvg } from '@/lib/barcode';
import {
  getSavedPrinterSettings,
  savePrinterSettings,
  isWebBluetoothSupported,
  printViaWebBluetooth,
  type PaperSize,
  type PrinterSettings,
  type InvoicePrintData
} from '@/lib/bluetooth-printer';
import { useStoreSettingsQuery } from '@/hooks/use-store-settings';
import { useStoreBanksQuery } from '@/hooks/use-store-banks';
import { formatStoreBankDetails } from '@/lib/order-whatsapp';
import { getOrderStatusLabel } from '@/lib/order-status';
import type { Order } from '@/hooks/use-orders';

interface OrderInvoiceDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderInvoiceDialog({ order, open, onOpenChange }: OrderInvoiceDialogProps) {
  const [viewMode, setViewMode] = useState<'standard' | 'thermal'>('standard');
  const [showSettings, setShowSettings] = useState(false);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(getSavedPrinterSettings);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: storeSettings } = useStoreSettingsQuery();
  const { data: storeBanks = [] } = useStoreBanksQuery();

  const storeName = storeSettings?.storeName?.trim() || 'RIO COLLECTION';
  const storeAddress =
    [storeSettings?.originCityName, storeSettings?.originProvinceName].filter(Boolean).join(', ') ||
    'Indonesia';
  const storePhone = storeSettings?.whatsappNumber || '';

  const bankDetails = formatStoreBankDetails(storeBanks, storeSettings);

  const subtotal = useMemo(() => {
    if (order.subtotal && order.subtotal > 0) return order.subtotal;
    return order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [order]);

  const shippingFee = order.shippingFee || 0;
  const discount = order.discountAmount || 0;
  const barcodeSvg = useMemo(
    () => generateBarcodeSvg(order.orderNumber, { height: 42, fontSize: 10 }),
    [order.orderNumber]
  );

  const printData: InvoicePrintData = useMemo(
    () => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status:
        order.status === 'FULFILLED'
          ? 'LUNAS & DIKIRIM'
          : getOrderStatusLabel(order.status).toUpperCase(),
      storeName,
      storeAddress,
      storePhone,
      customerName: order.fullName,
      customerPhone: order.whatsapp,
      shippingAddress: order.address,
      courierName: order.courierName || 'JNE Express',
      trackingNumber: order.trackingNumber || '',
      items: order.items.map((item) => ({
        name: item.name,
        variant: [item.size, item.isPreOrder ? 'PO' : ''].filter(Boolean).join(' - '),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal,
      shippingFee,
      discount,
      totalPrice: order.totalPrice,
      bankDetails
    }),
    [order, storeName, storeAddress, storePhone, subtotal, shippingFee, discount, bankDetails]
  );

  const handleUpdateSettings = (newSettings: Partial<PrinterSettings>) => {
    const updated = { ...printerSettings, ...newSettings };
    setPrinterSettings(updated);
    savePrinterSettings(updated);
    toast.success('Pengaturan printer berhasil disimpan');
  };

  // Generates standalone monochrome HTML for A4 Invoice PDF
  const generateStandardInvoiceHtml = () => {
    const statusText =
      order.status === 'FULFILLED'
        ? 'LUNAS & DIKIRIM'
        : getOrderStatusLabel(order.status).toUpperCase();

    const itemRows = order.items
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #111; font-size: 11px;">
          <td style="padding: 9px 6px; color: #555; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 9px 6px;">
            <strong style="color: #000; display: block;">${item.name}</strong>
            ${item.isPreOrder ? '<span style="display: inline-block; font-size: 9px; font-weight: bold; border: 1px solid #000; color: #000; padding: 1px 4px; margin-top: 2px;">PRE-ORDER</span>' : ''}
          </td>
          <td style="padding: 9px 6px; text-align: center; font-weight: bold; color: #000;">${item.size}</td>
          <td style="padding: 9px 6px; text-align: right; font-family: monospace; color: #000;">${formatIDR(item.price)}</td>
          <td style="padding: 9px 6px; text-align: center; font-weight: bold; color: #000;">${item.quantity}</td>
          <td style="padding: 9px 6px; text-align: right; font-family: monospace; font-weight: bold; color: #000;">${formatIDR(item.price * item.quantity)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.orderNumber} - ${storeName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      color: #000000 !important;
    }
    body, h1, h2, h3, h4, p, ul, ol, figure {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-wrapper {
      width: 100%;
      max-width: 794px;
      padding: 44px 48px 56px 48px;
      box-sizing: border-box;
      background: #ffffff;
      margin: 0 auto;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .invoice-wrapper {
        padding: 0 !important;
        max-width: none !important;
      }
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .store-name {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .invoice-tag {
      border: 2px solid #000;
      font-weight: 900;
      font-size: 11px;
      text-transform: uppercase;
      padding: 3px 8px;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      border-bottom: 1px solid #000;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .info-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      color: #333 !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      border-bottom: 2px solid #000;
      padding: 8px 6px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }
    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-top: 2px solid #000;
      padding-top: 14px;
      margin-top: 8px;
    }
    .total-box {
      width: 260px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px dashed #000;
      text-align: center;
      font-size: 10px;
      color: #333 !important;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper" style="padding: 44px 48px 56px 48px; box-sizing: border-box; background: #ffffff; width: 100%;">
  <div class="header">
    <div>
      <div class="store-name">${storeName}</div>
      <div style="font-size: 11px; margin-top: 4px;">${storeAddress}</div>
      ${storePhone ? `<div style="font-size: 11px; font-family: monospace;">WhatsApp: +${formatWaNumber(storePhone)}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div class="invoice-tag">INVOICE PESANAN</div>
      <div style="font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 6px;">INV/${order.orderNumber}</div>
      <div style="font-size: 11px; margin-top: 2px;">
        Tgl: ${new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      <div style="margin-top: 6px;">
        <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border: 1px solid #000; text-transform: uppercase;">
          ${statusText}
        </span>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-title">DITUJUKAN KEPADA:</div>
      <div style="font-weight: bold; font-size: 13px;">${order.fullName}</div>
      <div style="font-family: monospace; font-size: 11px; margin-top: 2px;">+${formatWaNumber(order.whatsapp)}</div>
      <div style="font-size: 11px; margin-top: 4px; white-space: pre-wrap;">${order.address}</div>
    </div>

    <div>
      <div class="info-title">PENGIRIMAN &amp; PEMBAYARAN:</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span>Ekspedisi:</span>
        <strong style="font-family: monospace;">${order.courierName || '-'}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span>No. Resi:</span>
        <strong style="font-family: monospace;">${order.trackingNumber || '-'}</strong>
      </div>
      <div style="border-top: 1px solid #000; padding-top: 6px; margin-top: 6px;">
        <div style="font-size: 10px; margin-bottom: 2px;">Info Rekening Toko:</div>
        <div style="font-family: monospace; font-size: 10px; white-space: pre-line;">${bankDetails}</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 24px; text-align: left;">#</th>
        <th style="text-align: left;">Deskripsi Produk</th>
        <th style="width: 60px; text-align: center;">Ukuran</th>
        <th style="width: 90px; text-align: right;">Harga</th>
        <th style="width: 40px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="total-section">
    <div style="width: 220px;">
      <div class="info-title">BARCODE PESANAN:</div>
      <div style="padding: 6px; border: 1px solid #000; background: #fff;">
        ${barcodeSvg}
      </div>
      <div style="font-size: 9px; text-align: center; margin-top: 4px; font-family: monospace;">
        Scan untuk verifikasi gudang &amp; ekspedisi
      </div>
    </div>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal Produk:</span>
        <strong style="font-family: monospace;">${formatIDR(subtotal)}</strong>
      </div>
      <div class="total-row">
        <span>Ongkir (${order.courierName || 'Kurir'}):</span>
        <strong style="font-family: monospace;">${formatIDR(shippingFee)}</strong>
      </div>
      ${
        discount > 0
          ? `
      <div class="total-row">
        <span>Diskon Voucher:</span>
        <strong style="font-family: monospace;">-${formatIDR(discount)}</strong>
      </div>`
          : ''
      }
      <div class="grand-total">
        <span>TOTAL BAYAR:</span>
        <span style="font-family: monospace;">${formatIDR(order.totalPrice)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div style="font-weight: bold; margin-bottom: 2px;">Terima kasih telah berbelanja di ${storeName}!</div>
    <div>Simpan invoice ini sebagai bukti resmi transaksi Anda.</div>
  </div>
  </div>
</body>
</html>`;
  };

  // Generates standalone monochrome HTML for Thermal Receipt Printing
  const generateThermalPrintHtml = () => {
    const width = printerSettings.paperSize === '80mm' ? '74mm' : '54mm';
    const isPaid = order.status === 'PAID' || order.status === 'FULFILLED';

    const itemsHtml = order.items
      .map(
        (i) => `
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold;">${i.name} (${i.size})</div>
          <div style="display: flex; justify-content: space-between;">
            <span>${i.quantity}x @${formatIDR(i.price)}</span>
            <span style="font-weight: bold;">${formatIDR(i.quantity * i.price)}</span>
          </div>
        </div>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk #${order.orderNumber}</title>
  <style>
    @page {
      size: ${printerSettings.paperSize === '80mm' ? '80mm' : '58mm'} auto;
      margin: 2mm 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
    }
    body {
      font-family: "Courier New", Courier, monospace;
      width: ${width};
      margin: 0 auto;
      padding: 6px;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
    .flex-row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 13px; text-transform: uppercase;">${storeName}</div>
  <div class="center" style="font-size: 10px;">${storeAddress}</div>
  ${storePhone ? `<div class="center" style="font-size: 10px;">WA: ${storePhone}</div>` : ''}

  <div class="divider"></div>

  <div style="font-size: 10px;">
    <div><strong>NO: #${order.orderNumber}</strong></div>
    <div>TGL: ${new Date(order.createdAt).toLocaleDateString('id-ID')}</div>
    <div>STATUS: ${isPaid ? 'LUNAS' : 'BELUM LUNAS'}</div>
    <div>CUST: ${order.fullName}</div>
    <div>HP: ${order.whatsapp}</div>
    <div>KIRIM: ${order.courierName || 'Reguler'}</div>
    ${order.trackingNumber ? `<div>RESI: ${order.trackingNumber}</div>` : ''}
  </div>

  <div class="divider"></div>

  <div>${itemsHtml}</div>

  <div class="divider"></div>

  <div style="font-size: 10px;">
    <div class="flex-row">
      <span>Subtotal</span>
      <span>${formatIDR(subtotal)}</span>
    </div>
    <div class="flex-row">
      <span>Ongkir</span>
      <span>${formatIDR(shippingFee)}</span>
    </div>
    ${
      discount > 0
        ? `
    <div class="flex-row">
      <span>Diskon</span>
      <span>-${formatIDR(discount)}</span>
    </div>`
        : ''
    }
    <div class="double-divider"></div>
    <div class="flex-row bold" style="font-size: 12px;">
      <span>TOTAL</span>
      <span>${formatIDR(order.totalPrice)}</span>
    </div>
  </div>

  <div style="margin: 8px 0; text-align: center;">
    ${barcodeSvg}
  </div>

  <div class="center" style="font-size: 9px; margin-top: 6px;">
    <div class="bold">Terima Kasih!</div>
    <div>Simpan struk sebagai bukti resmi.</div>
  </div>
</body>
</html>`;
  };

  // Prints the isolated HTML via a hidden iframe
  const printViaIframe = (contentHtml: string) => {
    const existing = document.getElementById('rio-invoice-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'rio-invoice-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Gagal menyiapkan jendela cetak.');
      return;
    }

    doc.open();
    doc.write(contentHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (printErr) {
        console.error('Print iframe failed:', printErr);
        toast.error('Gagal membuka dialog printer browser.');
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }
    }, 250);
  };

  // Direct PDF Download (Save as File)
  const handleDownloadInvoicePdf = async () => {
    setIsDownloadingPdf(true);
    const toastId = toast.loading('Menyiapkan file PDF invoice...');

    let tempContainer: HTMLDivElement | null = null;
    try {
      // Always create a clean, dedicated 794px A4 container with zero external styling conflicts
      tempContainer = document.createElement('div');
      tempContainer.id = 'rio-temp-invoice-export';
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px';
      tempContainer.style.minHeight = '1123px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-9999';
      tempContainer.innerHTML = generateStandardInvoiceHtml();
      document.body.appendChild(tempContainer);

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      if (tempContainer) {
        tempContainer.remove();
        tempContainer = null;
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > pageHeight + 5) {
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 5) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      // Native Blob download: works seamlessly on Mobile (iOS Safari, Android Chrome) and Desktop
      const pdfBlob = pdf.output('blob');
      const fileName = `Invoice-${order.orderNumber}.pdf`;
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        downloadLink.remove();
        URL.revokeObjectURL(blobUrl);
      }, 1500);

      toast.success('Invoice berhasil didownload (PDF)!', { id: toastId });
    } catch (err: unknown) {
      console.error('Download PDF error:', err);
      toast.error('Gagal mengunduh file PDF invoice. Silakan coba kembali.', {
        id: toastId
      });
    } finally {
      if (tempContainer) {
        tempContainer.remove();
      }
      setIsDownloadingPdf(false);
    }
  };

  // Browser Standard Print / Thermal Print Trigger
  const handlePrintStandard = () => {
    if (viewMode === 'thermal') {
      const html = generateThermalPrintHtml();
      printViaIframe(html);
    } else {
      const html = generateStandardInvoiceHtml();
      printViaIframe(html);
    }
  };

  // Web Bluetooth Thermal Print
  const handlePrintBluetooth = async () => {
    setIsBluetoothPrinting(true);
    const toastId = toast.loading('Menghubungkan ke printer Bluetooth...');

    try {
      const result = await printViaWebBluetooth(printData, printerSettings);
      if (result.success) {
        toast.success(`Struk berhasil dicetak di ${result.deviceName || 'Printer Bluetooth'}!`, {
          id: toastId
        });
        setPrinterSettings((prev) => ({ ...prev, lastDeviceName: result.deviceName }));
      } else if (result.isGloballyDisabled) {
        toast.info(
          'Web Bluetooth dinonaktifkan browser. Membuka dialog cetak printer bawaan laptop/PC...',
          { id: toastId, duration: 4000 }
        );
        const html = generateThermalPrintHtml();
        printViaIframe(html);
      } else {
        toast.error(result.error || 'Gagal mencetak ke printer Bluetooth', {
          id: toastId
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes('globally disabled') ||
        errMsg.toLowerCase().includes('disabled') ||
        errMsg.toLowerCase().includes('securityerror')
      ) {
        toast.info(
          'Web Bluetooth dinonaktifkan browser. Membuka dialog cetak printer bawaan laptop/PC...',
          { id: toastId, duration: 4000 }
        );
        const html = generateThermalPrintHtml();
        printViaIframe(html);
      } else {
        toast.error(errMsg || 'Terjadi kendala koneksi Bluetooth', {
          id: toastId
        });
      }
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  // Copy plain text receipt
  const handleCopyTextReceipt = () => {
    const lines = [
      `================================`,
      `       ${storeName.toUpperCase()}`,
      storeAddress,
      storePhone ? `WA: ${storePhone}` : '',
      `================================`,
      `No. Order : #${order.orderNumber}`,
      `Tanggal   : ${new Date(order.createdAt).toLocaleDateString('id-ID')}`,
      `Status    : ${printData.status}`,
      `Pelanggan : ${order.fullName}`,
      `No. HP    : ${order.whatsapp}`,
      `Alamat    : ${order.address}`,
      `Kurir     : ${order.courierName || 'Reguler'} ${order.trackingNumber ? `(${order.trackingNumber})` : ''}`,
      `--------------------------------`,
      `RINCIAN ITEM:`,
      ...order.items.map(
        (i) =>
          `${i.name} (${i.size})\n  ${i.quantity} x Rp ${i.price.toLocaleString('id-ID')} = Rp ${(i.quantity * i.price).toLocaleString('id-ID')}`
      ),
      `--------------------------------`,
      `Subtotal  : Rp ${subtotal.toLocaleString('id-ID')}`,
      `Ongkir    : Rp ${shippingFee.toLocaleString('id-ID')}`,
      discount > 0 ? `Diskon    : -Rp ${discount.toLocaleString('id-ID')}` : '',
      `TOTAL     : Rp ${order.totalPrice.toLocaleString('id-ID')}`,
      `================================`,
      `Terima kasih telah berbelanja di`,
      `${storeName}!`
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReceipt(true);
    toast.success('Teks struk berhasil disalin ke clipboard');
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const isBluetoothAvail = isWebBluetoothSupported();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-border/60">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/30 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Printer className="h-4.5 w-4.5 text-primary" />
              Cetak Invoice Pesanan #{order.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Cetak invoice siap kirim (A4/PDF) atau kirim langsung ke printer thermal Bluetooth
              POS.
            </DialogDescription>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'standard'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Invoice (A4 / PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'thermal'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ReceiptText className="h-3.5 w-3.5" />
              <span>Struk Thermal ({printerSettings.paperSize})</span>
            </button>
          </div>
        </div>

        {/* Warning if order is not FULFILLED */}
        {order.status !== 'FULFILLED' && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Pesanan ini berstatus{' '}
              <strong>{getOrderStatusLabel(order.status)}</strong>. Invoice resmi diterbitkan untuk
              pesanan yang telah dikirim (FULFILLED).
            </span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-muted/10 border-b border-border/20 flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'standard' ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownloadInvoicePdf}
                  disabled={isDownloadingPdf}
                  className="h-8 gap-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{isDownloadingPdf ? 'Mengunduh PDF...' : 'Download Invoice (PDF)'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintStandard}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer border-border/60 hover:bg-muted text-foreground"
                  title="Cetak langsung ke kertas via printer fisik"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handlePrintStandard}
                className="h-8 gap-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Struk Thermal (USB / Bluetooth)</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTextReceipt}
              className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {copiedReceipt ? (
                <Check className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedReceipt ? 'Tersalin' : 'Salin Teks'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={`h-8 gap-1.5 rounded-lg text-xs font-medium cursor-pointer border-border/60 ${
                showSettings ? 'bg-muted' : ''
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Setting Printer</span>
              {printerSettings.lastDeviceName && (
                <span className="max-w-20 truncate text-[10px] text-muted-foreground">
                  ({printerSettings.lastDeviceName})
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Printer Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-muted/40 border-b border-border/30 space-y-3 shrink-0 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Bluetooth className="h-4 w-4 text-primary" />
                Konfigurasi Printer Bluetooth Thermal
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Paper Size */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Ukuran Kertas Thermal</Label>
                <div className="flex items-center gap-1.5">
                  {(['58mm', '80mm'] as PaperSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleUpdateSettings({ paperSize: size })}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex-1 ${
                        printerSettings.paperSize === size
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-background hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  58mm: 32 karakter/baris (mini). 80mm: 48 karakter/baris.
                </p>
              </div>

              {/* Auto Cut */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Potong Kertas (Auto-Cut)</Label>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ autoCut: !printerSettings.autoCut })}
                  className={`w-full py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    printerSettings.autoCut
                      ? 'bg-primary/10 text-foreground border-primary/30'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  <span>{printerSettings.autoCut ? 'Aktif (Kirim Perintah Cut)' : 'Nonaktif'}</span>
                </button>
                <p className="text-[10px] text-muted-foreground">
                  Hanya bekerja pada printer yang memiliki cutter otomatis.
                </p>
              </div>

              {/* Status Bluetooth */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Koneksi Bluetooth Langsung</Label>
                <div className="p-2 rounded-lg bg-background border border-border/50 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {isBluetoothAvail ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />
                          <span className="font-semibold text-foreground">Didukung</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Chrome / Edge
                          </span>
                        </>
                      )}
                    </div>
                    {isBluetoothAvail && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrintBluetooth}
                        disabled={isBluetoothPrinting}
                        className="h-6 text-[10px] px-2 gap-1 cursor-pointer"
                      >
                        {isBluetoothPrinting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Bluetooth className="h-3 w-3" />
                        )}
                        Tes BLE
                      </Button>
                    )}
                  </div>
                  {printerSettings.lastDeviceName && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      Terakhir: {printerSettings.lastDeviceName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Helpful Notice for Laptop/PC */}
            <div className="p-2.5 rounded-lg bg-background/90 border border-border/50 text-[11px] space-y-1 text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span>💡</span>
                <span>Opsi Cetak Laptop / PC Windows:</span>
              </div>
              <p>
                Di laptop, printer thermal <strong>USB</strong> maupun <strong>Bluetooth</strong>{' '}
                bisa langsung dipakai melalui tombol utama{' '}
                <strong>&quot;Cetak Struk Thermal&quot;</strong> (pastikan printer Bluetooth sudah
                di-pair di <strong>Windows Settings &gt; Bluetooth &gt; Printers</strong>).
              </p>
              <p className="text-[10px]">
                Untuk mengaktifkan Web Bluetooth langsung di Chrome: buka{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
                  chrome://flags/#enable-web-bluetooth
                </code>{' '}
                lalu pilih <strong>Enabled</strong> dan Relaunch browser.
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 pb-16 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center">
          {viewMode === 'standard' ? (
            /* A4 / PDF Document Invoice Layout (100% Monochrome Black & White) */
            <div className="w-full flex justify-center pb-4">
              <div
                id="rio-invoice-a4-target"
                className="w-full max-w-190 bg-white text-black shadow-lg rounded-xl p-4 sm:p-10 text-xs font-sans leading-relaxed border border-zinc-300 min-w-0"
              >
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-black pb-4 sm:pb-5 gap-3 sm:gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black uppercase">
                      {storeName}
                    </h1>
                    <p className="text-[11px] text-zinc-700 mt-1 max-w-sm">{storeAddress}</p>
                    {storePhone && (
                      <p className="text-[11px] text-zinc-700 font-mono mt-0.5">
                        WhatsApp: +{formatWaNumber(storePhone)}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="inline-block border-2 border-black text-black font-black text-xs uppercase px-3 py-1 tracking-wider">
                      INVOICE PESANAN
                    </div>
                    <p className="font-mono font-bold text-sm text-black mt-1.5">
                      INV/{order.orderNumber}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Tgl:{' '}
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold border border-black text-black uppercase tracking-wider">
                        {order.status === 'FULFILLED'
                          ? 'LUNAS & DIKIRIM'
                          : getOrderStatusLabel(order.status).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Info: Recipient & Shipping Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-5 border-b border-black">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
                      DITUJUKAN KEPADA:
                    </span>
                    <p className="font-bold text-black text-sm">{order.fullName}</p>
                    <p className="font-mono text-black text-[11px] mt-0.5">
                      +{formatWaNumber(order.whatsapp)}
                    </p>
                    <p className="text-zinc-700 text-[11px] mt-1 leading-relaxed whitespace-pre-wrap">
                      {order.address}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
                      DETAIL PENGIRIMAN &amp; PEMBAYARAN:
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Ekspedisi:</span>
                        <span className="font-bold text-black">
                          {order.courierName || 'JNE Express'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">No. Resi:</span>
                        <span className="font-mono font-bold text-black">
                          {order.trackingNumber || '-'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-zinc-300 mt-2">
                        <span className="text-[10px] text-zinc-600 block mb-0.5">
                          Info Rekening Toko:
                        </span>
                        <p className="font-mono text-[10px] text-black whitespace-pre-line leading-tight">
                          {bankDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Table (Horizontal scroll wrapper on mobile) */}
                <div className="py-4 overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <table className="w-full min-w-110 sm:min-w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black text-[10px] font-bold uppercase text-black tracking-wider">
                        <th className="py-2.5 w-8">#</th>
                        <th className="py-2.5">Deskripsi Produk</th>
                        <th className="py-2.5 text-center w-16">Ukuran</th>
                        <th className="py-2.5 text-right w-24">Harga</th>
                        <th className="py-2.5 text-center w-12">Qty</th>
                        <th className="py-2.5 text-right w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-300">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="py-3 text-zinc-600 font-mono">{idx + 1}</td>
                          <td className="py-3 pr-2">
                            <span className="font-bold text-black block">{item.name}</span>
                            {item.isPreOrder && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 border border-black text-black text-[9px] font-bold">
                                PRE-ORDER
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center font-bold text-black">{item.size}</td>
                          <td className="py-3 text-right font-mono text-black">
                            {formatIDR(item.price)}
                          </td>
                          <td className="py-3 text-center font-bold text-black">{item.quantity}</td>
                          <td className="py-3 text-right font-mono font-bold text-black">
                            {formatIDR(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation & Total Breakdown */}
                <div className="border-t-2 border-black pt-4 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-5 sm:gap-6">
                  {/* Left: Barcode for Warehousing / Courier scanning */}
                  <div className="w-full sm:w-56 shrink-0 pt-1 text-center sm:text-left">
                    <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">
                      Barcode Pesanan:
                    </span>
                    <div
                      className="bg-white p-2 border border-black inline-block max-w-full"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                    <p className="text-[9px] text-zinc-600 text-center sm:text-left mt-1 font-mono">
                      Scan untuk verifikasi gudang &amp; ekspedisi
                    </p>
                  </div>

                  {/* Right: Calculations */}
                  <div className="w-full sm:w-64 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-zinc-700">
                      <span>Subtotal Produk</span>
                      <span className="font-mono font-bold text-black">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>Ongkir ({order.courierName || 'Kurir'})</span>
                      <span className="font-mono font-bold text-black">
                        {formatIDR(shippingFee)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-black">
                        <span>Diskon Voucher</span>
                        <span className="font-mono font-bold">-{formatIDR(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-black pt-2 border-t-2 border-black">
                      <span>TOTAL BAYAR</span>
                      <span className="font-mono">{formatIDR(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Footer */}
                <div className="mt-8 pt-4 border-t border-dashed border-zinc-400 text-center text-[10px] text-zinc-600 space-y-0.5">
                  <p className="font-bold text-black">
                    Terima kasih telah berbelanja di {storeName}!
                  </p>
                  <p>
                    Apabila ada pertanyaan terkait pesanan, hubungi layanan pelanggan kami melalui
                    WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Thermal Receipt Layout (58mm / 80mm preview - 100% Monochrome Black & White) */
            <div className="w-full flex justify-center pb-4">
              <div
                className={`bg-white text-black font-mono text-[11px] p-4 shadow-xl border border-zinc-400 rounded-none leading-tight transition-all max-w-full ${
                  printerSettings.paperSize === '80mm' ? 'w-80' : 'w-72'
                }`}
              >
                <div className="text-center pb-2 border-b border-dashed border-black">
                  <p className="text-sm font-black uppercase text-black">{storeName}</p>
                  <p className="text-[10px] text-black">{storeAddress}</p>
                  {storePhone && <p className="text-[10px] text-black">WA: {storePhone}</p>}
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px] text-black">
                  <p className="font-bold">NO: #{order.orderNumber}</p>
                  <p>TGL: {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                  <p>STATUS: {printData.status}</p>
                  <p className="truncate">CUST: {order.fullName}</p>
                  <p>HP: {order.whatsapp}</p>
                  <p>KIRIM: {order.courierName || 'Reguler'}</p>
                  {order.trackingNumber && (
                    <p className="font-bold">RESI: {order.trackingNumber}</p>
                  )}
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[10px] text-black">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-bold truncate text-black">
                        {item.name} ({item.size})
                      </p>
                      <div className="flex justify-between text-black">
                        <span>
                          {item.quantity}x @{formatIDR(item.price)}
                        </span>
                        <span className="font-bold">{formatIDR(item.quantity * item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="py-2 border-b-2 border-black space-y-1 text-[10px] text-black">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkir</span>
                    <span>{formatIDR(shippingFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span>Diskon</span>
                      <span>-{formatIDR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-dashed border-black">
                    <span>TOTAL</span>
                    <span>{formatIDR(order.totalPrice)}</span>
                  </div>
                </div>

                {/* Thermal Barcode preview */}
                <div className="pt-3 pb-1 text-center">
                  <div
                    className="max-w-50 mx-auto bg-white"
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                </div>

                <div className="text-center pt-2 text-[9px] text-black space-y-0.5">
                  <p className="font-bold">Terima Kasih!</p>
                  <p>Simpan struk sebagai bukti resmi.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
