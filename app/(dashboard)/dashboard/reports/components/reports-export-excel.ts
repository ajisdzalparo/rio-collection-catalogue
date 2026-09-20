import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import type { Order } from '@/hooks/use-orders';
import type { ReportStatus } from './types';
import { netItemRevenues } from '@/lib/referral';

interface ExportExcelParams {
  currentOrders: Order[];
  selectedProducts: string[];
  selectedStatuses: ReportStatus[];
  startDate: string;
  endDate: string;
}

interface AccountingRow {
  orderNumber: string;
  date: Date;
  status: string;
  customer: string;
  product: string;
  size: string;
  quantity: number;
  unitPrice: number;
  grossSales: number;
  discount: number;
  referralCode: string;
  referralPartner: string;
  sales: number;
  cogs: number;
  grossProfit: number;
  referralReward: number;
  netProfit: number;
  shippingFee: number;
  received: number;
}

const DEFAULT_HPP = 0;
const CURRENCY_FORMAT = '"Rp" #,##0;[Red]("Rp" #,##0);"-"';
const NUMBER_FORMAT = '#,##0';
const PERCENT_FORMAT = '0.0%';

function safeExcelText(value: string) {
  const normalized = value.trim() || '-';
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

function getStatusLabel(status: Order['status']) {
  return status === 'FULFILLED' ? 'Dikirim' : 'Lunas';
}

function buildAccountingRows(
  orders: Order[],
  selectedProducts: string[]
): { rows: AccountingRow[]; usesDefaultHpp: boolean } {
  const rows: AccountingRow[] = [];
  let usesDefaultHpp = false;

  orders.forEach((order) => {
    const revenues = netItemRevenues(order.items, order.discountAmount ?? 0);
    const totalGrossOrder = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const items = order.items.map((item, index) => ({ item, index })).filter(
      ({ item }) => selectedProducts.length === 0 || selectedProducts.includes(item.name)
    );

    items.forEach(({ item, index }, itemIndex) => {
      const unitHpp = item.cogs ?? DEFAULT_HPP;
      if (item.cogs === undefined) usesDefaultHpp = true;
      const grossItem = item.price * item.quantity;
      const sales = revenues[index];
      const discount = Math.max(0, grossItem - sales);
      const cogs = unitHpp * item.quantity;
      const grossProfit = sales - cogs;

      const itemRatio = totalGrossOrder > 0 ? grossItem / totalGrossOrder : 0;
      const referralReward = Math.round((order.referralRewardAmount ?? 0) * itemRatio);
      const netProfit = grossProfit - referralReward;

      const shippingFee = selectedProducts.length === 0 && itemIndex === 0
        ? order.shippingFee ?? 0
        : 0;

      rows.push({
        orderNumber: safeExcelText(order.orderNumber),
        date: new Date(order.createdAt),
        status: getStatusLabel(order.status),
        customer: safeExcelText(order.fullName),
        product: safeExcelText(item.name),
        size: safeExcelText(item.size),
        quantity: item.quantity,
        unitPrice: item.price,
        grossSales: grossItem,
        discount,
        referralCode: safeExcelText(order.referralCodeSnapshot || '-'),
        referralPartner: safeExcelText(order.referralPartnerSnapshot || '-'),
        sales,
        cogs,
        grossProfit,
        referralReward,
        netProfit,
        shippingFee,
        received: sales + shippingFee
      });
    });
  });

  return { rows, usesDefaultHpp };
}

export async function exportReportToExcel({
  currentOrders,
  selectedProducts,
  selectedStatuses,
  startDate,
  endDate
}: ExportExcelParams): Promise<void> {
  const paidOrders = currentOrders.filter(
    (order) => order.status === 'PAID' || order.status === 'FULFILLED'
  );
  const { rows, usesDefaultHpp } = buildAccountingRows(paidOrders, selectedProducts);

  if (rows.length === 0) {
    toast.error('Tidak ada penjualan lunas pada periode dan produk yang dipilih.');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RIO Collection Official';
    workbook.created = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    // Totals calculation
    const totalOrderCount = new Set(rows.map((r) => r.orderNumber)).size;
    const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);
    const totalGrossSales = rows.reduce((sum, r) => sum + r.grossSales, 0);
    const totalDiscount = rows.reduce((sum, r) => sum + r.discount, 0);
    const totalSales = rows.reduce((sum, r) => sum + r.sales, 0);
    const totalCogs = rows.reduce((sum, r) => sum + r.cogs, 0);
    const totalGrossProfit = rows.reduce((sum, r) => sum + r.grossProfit, 0);
    const totalReferralReward = rows.reduce((sum, r) => sum + r.referralReward, 0);
    const totalNetProfit = rows.reduce((sum, r) => sum + r.netProfit, 0);
    const totalShippingFee = rows.reduce((sum, r) => sum + r.shippingFee, 0);
    const totalReceived = rows.reduce((sum, r) => sum + r.received, 0);
    const netMarginRate = totalSales > 0 ? totalNetProfit / totalSales : 0;

    const BORDER_THIN: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    const HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Slate 900
    };

    const ACCENT_HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };

    // ==========================================
    // SHEET 1: RINGKASAN EKSEKUTIF (SUMMARY)
    // ==========================================
    const summarySheet = workbook.addWorksheet('Ringkasan Bisnis', {
      views: [{ showGridLines: true }]
    });

    summarySheet.columns = [
      { key: 'c1', width: 4 },
      { key: 'c2', width: 28 },
      { key: 'c3', width: 14 },
      { key: 'c4', width: 18 },
      { key: 'c5', width: 18 },
      { key: 'c6', width: 18 },
      { key: 'c7', width: 18 },
      { key: 'c8', width: 18 },
      { key: 'c9', width: 18 },
      { key: 'c10', width: 18 }
    ];

    // Header Title
    summarySheet.mergeCells('B2:J2');
    const titleCell = summarySheet.getCell('B2');
    titleCell.value = 'RIO COLLECTION — LAPORAN KINERJA BISNIS, PENJUALAN & REFERRAL';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } };

    // Metadata Strip
    summarySheet.getCell('B4').value = 'Periode Laporan:';
    summarySheet.getCell('B4').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } };
    summarySheet.getCell('C4').value = `${startDate} s.d. ${endDate}`;
    summarySheet.getCell('C4').font = { name: 'Arial', size: 9, bold: true };

    summarySheet.getCell('E4').value = 'Tanggal Dibuat:';
    summarySheet.getCell('E4').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } };
    summarySheet.getCell('F4').value = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    summarySheet.getCell('F4').font = { name: 'Arial', size: 9, bold: true };

    summarySheet.getCell('B5').value = 'Filter Produk:';
    summarySheet.getCell('B5').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } };
    summarySheet.getCell('C5').value = selectedProducts.length === 0 ? 'Semua Produk' : selectedProducts.join(', ');
    summarySheet.getCell('C5').font = { name: 'Arial', size: 9 };

    summarySheet.getCell('E5').value = 'Status Pesanan:';
    summarySheet.getCell('E5').font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } };
    summarySheet.getCell('F5').value = selectedStatuses.length === 0 ? 'Lunas & Dikirim' : selectedStatuses.map(getStatusLabel).join(', ');
    summarySheet.getCell('F5').font = { name: 'Arial', size: 9 };

    // KPI Summary Section (Card-style grid)
    summarySheet.mergeCells('B7:J7');
    const kpiTitle = summarySheet.getCell('B7');
    kpiTitle.value = 'RINGKASAN EKSEKUTIF & REKONSILIASI KEUANGAN';
    kpiTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };

    const kpiHeaders = [
      'Total Pesanan',
      'Qty Terjual',
      'Penjualan Kotor',
      'Diskon Customer',
      'Penjualan Bersih',
      'Total HPP',
      'Komisi Referral',
      'Laba Bersih Akhir',
      'Margin Bersih'
    ];
    const kpiValues = [
      totalOrderCount,
      totalQuantity,
      totalGrossSales,
      totalDiscount,
      totalSales,
      totalCogs,
      totalReferralReward,
      totalNetProfit,
      netMarginRate
    ];

    const kpiRow1 = summarySheet.getRow(8);
    const kpiRow2 = summarySheet.getRow(9);
    kpiRow1.height = 20;
    kpiRow2.height = 24;

    kpiHeaders.forEach((header, idx) => {
      const colLetter = String.fromCharCode(66 + idx); // B, C, D, E, F, G, H, I, J
      const hCell = summarySheet.getCell(`${colLetter}8`);
      hCell.value = header;
      hCell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFFFF' } };
      hCell.fill = HEADER_FILL;
      hCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const vCell = summarySheet.getCell(`${colLetter}9`);
      vCell.value = kpiValues[idx];
      vCell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
      vCell.alignment = { horizontal: 'center', vertical: 'middle' };
      vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      vCell.border = BORDER_THIN;

      if (idx === 0 || idx === 1) vCell.numFmt = NUMBER_FORMAT;
      else if (idx === 8) vCell.numFmt = PERCENT_FORMAT;
      else vCell.numFmt = CURRENCY_FORMAT;
    });

    // Product Breakdown Table
    summarySheet.mergeCells('B11:J11');
    const prodBreakdownTitle = summarySheet.getCell('B11');
    prodBreakdownTitle.value = 'PERFORMA PENJUALAN PER PRODUK';
    prodBreakdownTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };

    const prodHeaders = ['No.', 'Nama Produk', 'Qty', 'Penjualan Bersih', 'Total HPP', 'Laba Kotor', 'Komisi Referral', 'Laba Bersih', 'Margin'];
    const prodHeaderRow = summarySheet.getRow(12);
    prodHeaderRow.height = 22;
    prodHeaders.forEach((hdr, idx) => {
      const colLetter = String.fromCharCode(66 + idx);
      const cell = summarySheet.getCell(`${colLetter}12`);
      cell.value = hdr;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = ACCENT_HEADER_FILL;
      cell.alignment = { horizontal: idx === 1 ? 'left' : 'center', vertical: 'middle' };
    });

    const productMap = new Map<string, { qty: number; sales: number; cogs: number; grossProfit: number; referralReward: number; netProfit: number }>();
    rows.forEach((r) => {
      const current = productMap.get(r.product) || { qty: 0, sales: 0, cogs: 0, grossProfit: 0, referralReward: 0, netProfit: 0 };
      current.qty += r.quantity;
      current.sales += r.sales;
      current.cogs += r.cogs;
      current.grossProfit += r.grossProfit;
      current.referralReward += r.referralReward;
      current.netProfit += r.netProfit;
      productMap.set(r.product, current);
    });

    let currentProdRow = 13;
    let prodIndex = 1;
    productMap.forEach((val, prodName) => {
      const pRow = summarySheet.getRow(currentProdRow);
      pRow.height = 20;
      pRow.font = { name: 'Arial', size: 9 };

      const margin = val.sales > 0 ? val.netProfit / val.sales : 0;

      pRow.getCell(2).value = prodIndex++;
      pRow.getCell(2).alignment = { horizontal: 'center' };
      pRow.getCell(3).value = prodName;
      pRow.getCell(4).value = val.qty;
      pRow.getCell(4).numFmt = NUMBER_FORMAT;
      pRow.getCell(4).alignment = { horizontal: 'right' };
      pRow.getCell(5).value = val.sales;
      pRow.getCell(5).numFmt = CURRENCY_FORMAT;
      pRow.getCell(6).value = val.cogs;
      pRow.getCell(6).numFmt = CURRENCY_FORMAT;
      pRow.getCell(7).value = val.grossProfit;
      pRow.getCell(7).numFmt = CURRENCY_FORMAT;
      pRow.getCell(8).value = val.referralReward;
      pRow.getCell(8).numFmt = CURRENCY_FORMAT;
      pRow.getCell(9).value = val.netProfit;
      pRow.getCell(9).numFmt = CURRENCY_FORMAT;
      pRow.getCell(10).value = margin;
      pRow.getCell(10).numFmt = PERCENT_FORMAT;
      pRow.getCell(10).alignment = { horizontal: 'right' };

      for (let c = 2; c <= 10; c++) {
        pRow.getCell(c).border = BORDER_THIN;
      }
      currentProdRow++;
    });

    // Product Breakdown Total Row
    const prodTotalRow = summarySheet.getRow(currentProdRow);
    prodTotalRow.height = 22;
    prodTotalRow.font = { name: 'Arial', size: 9, bold: true };
    summarySheet.mergeCells(`B${currentProdRow}:C${currentProdRow}`);
    prodTotalRow.getCell(2).value = 'TOTAL PERFORMA';
    prodTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    prodTotalRow.getCell(4).value = totalQuantity;
    prodTotalRow.getCell(4).numFmt = NUMBER_FORMAT;
    prodTotalRow.getCell(5).value = totalSales;
    prodTotalRow.getCell(5).numFmt = CURRENCY_FORMAT;
    prodTotalRow.getCell(6).value = totalCogs;
    prodTotalRow.getCell(6).numFmt = CURRENCY_FORMAT;
    prodTotalRow.getCell(7).value = totalGrossProfit;
    prodTotalRow.getCell(7).numFmt = CURRENCY_FORMAT;
    prodTotalRow.getCell(8).value = totalReferralReward;
    prodTotalRow.getCell(8).numFmt = CURRENCY_FORMAT;
    prodTotalRow.getCell(9).value = totalNetProfit;
    prodTotalRow.getCell(9).numFmt = CURRENCY_FORMAT;
    prodTotalRow.getCell(10).value = netMarginRate;
    prodTotalRow.getCell(10).numFmt = PERCENT_FORMAT;

    for (let c = 2; c <= 10; c++) {
      prodTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      prodTotalRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    }

    // ==========================================
    // SHEET 2: DATA TRANSAKSI DETAIL (RAW TABLE)
    // ==========================================
    const detailSheet = workbook.addWorksheet('Data Transaksi', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
    });

    detailSheet.columns = [
      { key: 'date', width: 14 },
      { key: 'orderNumber', width: 22 },
      { key: 'status', width: 12 },
      { key: 'customer', width: 22 },
      { key: 'product', width: 30 },
      { key: 'size', width: 10 },
      { key: 'quantity', width: 10 },
      { key: 'unitPrice', width: 16 },
      { key: 'grossSales', width: 18 },
      { key: 'discount', width: 16 },
      { key: 'referralCode', width: 16 },
      { key: 'referralPartner', width: 18 },
      { key: 'sales', width: 18 },
      { key: 'cogs', width: 18 },
      { key: 'grossProfit', width: 18 },
      { key: 'referralReward', width: 18 },
      { key: 'netProfit', width: 18 },
      { key: 'shippingFee', width: 15 },
      { key: 'received', width: 18 }
    ];

    detailSheet.mergeCells('A1:S1');
    const detailTitle = detailSheet.getCell('A1');
    detailTitle.value = `DATA DETAIL TRANSAKSI PENJUALAN & REFERRAL (${startDate} s.d. ${endDate})`;
    detailTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };

    detailSheet.mergeCells('A2:S2');
    const detailSubtitle = detailSheet.getCell('A2');
    detailSubtitle.value = `Total: ${totalOrderCount} Pesanan | Omset Bersih: Rp ${totalSales.toLocaleString('id-ID')} | Komisi Referral: Rp ${totalReferralReward.toLocaleString('id-ID')} | Laba Bersih: Rp ${totalNetProfit.toLocaleString('id-ID')}`;
    detailSubtitle.font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF475569' } };

    const transactionHeaders = [
      'Tanggal',
      'No. Pesanan',
      'Status',
      'Pelanggan',
      'Produk',
      'Ukuran',
      'Qty',
      'Harga Satuan',
      'Penjualan Kotor',
      'Diskon Referral',
      'Kode Referral',
      'Partner Referral',
      'Penjualan Bersih',
      'HPP',
      'Laba Kotor',
      'Komisi Referral',
      'Laba Bersih Akhir',
      'Ongkir',
      'Total Kas Masuk'
    ];

    const tHeaderRow = detailSheet.getRow(4);
    tHeaderRow.values = transactionHeaders;
    tHeaderRow.height = 26;
    tHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = HEADER_FILL;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = BORDER_THIN;
    });

    rows.forEach((row) => {
      const dataRow = detailSheet.addRow(row);
      dataRow.height = 20;
      dataRow.font = { name: 'Arial', size: 9 };
      dataRow.getCell(1).numFmt = 'dd mmm yyyy';
      dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
      dataRow.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
      dataRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(7).numFmt = NUMBER_FORMAT;
      dataRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

      dataRow.getCell(8).numFmt = CURRENCY_FORMAT;
      dataRow.getCell(9).numFmt = CURRENCY_FORMAT;
      dataRow.getCell(10).numFmt = CURRENCY_FORMAT;
      dataRow.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(12).alignment = { horizontal: 'left', vertical: 'middle' };

      for (let column = 13; column <= 19; column++) {
        dataRow.getCell(column).numFmt = CURRENCY_FORMAT;
        dataRow.getCell(column).alignment = { horizontal: 'right', vertical: 'middle' };
      }

      for (let column = 1; column <= 19; column++) {
        dataRow.getCell(column).border = BORDER_THIN;
      }
    });

    const lastDataRowNumber = 4 + rows.length;
    detailSheet.autoFilter = { from: 'A4', to: `S${lastDataRowNumber}` };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const productLabel = selectedProducts.length === 0
      ? 'Semua_Produk'
      : selectedProducts.join('-').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 60);
    const fileName = `Laporan_Keuangan_Penjualan_${startDate}_${endDate}_${productLabel}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Laporan Excel keuangan & referral berhasil diunduh.');
  } catch (error) {
    console.error('Failed to generate Excel report:', error);
    toast.error('Gagal mengekspor laporan Excel. Silakan coba kembali.');
  }
}
