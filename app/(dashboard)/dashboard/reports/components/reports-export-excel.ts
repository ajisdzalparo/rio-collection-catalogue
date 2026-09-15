import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import type { Order } from '@/hooks/use-orders';
import type { ReportStatus } from './types';

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
  sales: number;
  cogs: number;
  grossProfit: number;
  shippingFee: number;
  received: number;
}

const DEFAULT_HPP = 180000;
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
    const items = order.items.filter(
      (item) => selectedProducts.length === 0 || selectedProducts.includes(item.name)
    );

    items.forEach((item, itemIndex) => {
      const unitHpp = item.cogs ?? DEFAULT_HPP;
      if (item.cogs === undefined) usesDefaultHpp = true;
      const sales = item.price * item.quantity;
      const cogs = unitHpp * item.quantity;
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
        sales,
        cogs,
        grossProfit: sales - cogs,
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
    const totalSales = rows.reduce((sum, r) => sum + r.sales, 0);
    const totalCogs = rows.reduce((sum, r) => sum + r.cogs, 0);
    const totalGrossProfit = rows.reduce((sum, r) => sum + r.grossProfit, 0);
    const totalShippingFee = rows.reduce((sum, r) => sum + r.shippingFee, 0);
    const totalReceived = rows.reduce((sum, r) => sum + r.received, 0);
    const grossMarginRate = totalSales > 0 ? totalGrossProfit / totalSales : 0;

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
      { key: 'c7', width: 14 },
      { key: 'c8', width: 16 },
      { key: 'c9', width: 18 }
    ];

    // Header Title
    summarySheet.mergeCells('B2:I2');
    const titleCell = summarySheet.getCell('B2');
    titleCell.value = 'RIO COLLECTION — LAPORAN KINERJA BISNIS & PENJUALAN';
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
    summarySheet.mergeCells('B7:I7');
    const kpiTitle = summarySheet.getCell('B7');
    kpiTitle.value = 'RINGKASAN EKSEKUTIF (KEY PERFORMANCE INDICATORS)';
    kpiTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };

    const kpiHeaders = ['Total Pesanan', 'Qty Terjual', 'Penjualan Produk', 'Total HPP (Modal)', 'Laba Kotor', 'Margin Laba', 'Total Ongkir', 'Total Kas Masuk'];
    const kpiValues = [
      totalOrderCount,
      totalQuantity,
      totalSales,
      totalCogs,
      totalGrossProfit,
      grossMarginRate,
      totalShippingFee,
      totalReceived
    ];

    const kpiRow1 = summarySheet.getRow(8);
    const kpiRow2 = summarySheet.getRow(9);
    kpiRow1.height = 20;
    kpiRow2.height = 24;

    kpiHeaders.forEach((header, idx) => {
      const colLetter = String.fromCharCode(66 + idx); // B, C, D, E, F, G, H, I
      const hCell = summarySheet.getCell(`${colLetter}8`);
      hCell.value = header;
      hCell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFFFF' } };
      hCell.fill = HEADER_FILL;
      hCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const vCell = summarySheet.getCell(`${colLetter}9`);
      vCell.value = kpiValues[idx];
      vCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      vCell.alignment = { horizontal: 'center', vertical: 'middle' };
      vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      vCell.border = BORDER_THIN;

      if (idx === 0 || idx === 1) vCell.numFmt = NUMBER_FORMAT;
      else if (idx === 5) vCell.numFmt = PERCENT_FORMAT;
      else vCell.numFmt = CURRENCY_FORMAT;
    });

    // Product Breakdown Table
    summarySheet.mergeCells('B11:I11');
    const prodBreakdownTitle = summarySheet.getCell('B11');
    prodBreakdownTitle.value = 'PERFORMA PENJUALAN PER PRODUK';
    prodBreakdownTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };

    const prodHeaders = ['No.', 'Nama Produk', 'Qty', 'Total Omset', 'Total HPP', 'Laba Kotor', 'Margin', 'Kontribusi'];
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

    const productMap = new Map<string, { qty: number; sales: number; cogs: number; grossProfit: number }>();
    rows.forEach((r) => {
      const current = productMap.get(r.product) || { qty: 0, sales: 0, cogs: 0, grossProfit: 0 };
      current.qty += r.quantity;
      current.sales += r.sales;
      current.cogs += r.cogs;
      current.grossProfit += r.grossProfit;
      productMap.set(r.product, current);
    });

    let currentProdRow = 13;
    let prodIndex = 1;
    productMap.forEach((val, prodName) => {
      const pRow = summarySheet.getRow(currentProdRow);
      pRow.height = 20;
      pRow.font = { name: 'Arial', size: 9 };

      const contribution = totalSales > 0 ? val.sales / totalSales : 0;
      const margin = val.sales > 0 ? val.grossProfit / val.sales : 0;

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
      pRow.getCell(8).value = margin;
      pRow.getCell(8).numFmt = PERCENT_FORMAT;
      pRow.getCell(8).alignment = { horizontal: 'right' };
      pRow.getCell(9).value = contribution;
      pRow.getCell(9).numFmt = PERCENT_FORMAT;
      pRow.getCell(9).alignment = { horizontal: 'right' };

      for (let c = 2; c <= 9; c++) {
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
    prodTotalRow.getCell(8).value = grossMarginRate;
    prodTotalRow.getCell(8).numFmt = PERCENT_FORMAT;
    prodTotalRow.getCell(9).value = 1.0;
    prodTotalRow.getCell(9).numFmt = PERCENT_FORMAT;

    for (let c = 2; c <= 9; c++) {
      prodTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      prodTotalRow.getCell(c).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    }

    if (usesDefaultHpp) {
      const noteRow = currentProdRow + 2;
      summarySheet.getCell(`B${noteRow}`).value = `*Catatan: Terdapat produk dengan HPP kosong yang menggunakan default estimasi Rp ${DEFAULT_HPP.toLocaleString('id-ID')}.`;
      summarySheet.getCell(`B${noteRow}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
    }

    // ==========================================
    // SHEET 2: DATA TRANSAKSI DETAIL (RAW TABLE)
    // ==========================================
    const detailSheet = workbook.addWorksheet('Data Transaksi', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
    });

    detailSheet.columns = [
      { key: 'date', width: 14 },
      { key: 'orderNumber', width: 24 },
      { key: 'status', width: 12 },
      { key: 'customer', width: 24 },
      { key: 'product', width: 34 },
      { key: 'size', width: 10 },
      { key: 'quantity', width: 10 },
      { key: 'unitPrice', width: 16 },
      { key: 'sales', width: 18 },
      { key: 'cogs', width: 18 },
      { key: 'grossProfit', width: 18 },
      { key: 'shippingFee', width: 15 },
      { key: 'received', width: 18 }
    ];

    // Quick Stats Info Strip on Top of Data Sheet
    detailSheet.mergeCells('A1:M1');
    const detailTitle = detailSheet.getCell('A1');
    detailTitle.value = `DATA DETAIL TRANSAKSI PENJUALAN (${startDate} s.d. ${endDate})`;
    detailTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };

    detailSheet.mergeCells('A2:M2');
    const detailSubtitle = detailSheet.getCell('A2');
    detailSubtitle.value = `Total: ${totalOrderCount} Pesanan | ${totalQuantity} Pcs Produk | Omset: Rp ${totalSales.toLocaleString('id-ID')} | Laba Kotor: Rp ${totalGrossProfit.toLocaleString('id-ID')} (Tabel ini murni data tanpa baris total di bawah, aman untuk di-Sort A-Z & Filter)`;
    detailSubtitle.font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF475569' } };

    const transactionHeaders = [
      'Tanggal',
      'No. Pesanan',
      'Status',
      'Pelanggan',
      'Produk',
      'Ukuran',
      'Qty',
      'Harga Jual',
      'Penjualan Produk',
      'HPP',
      'Laba Kotor',
      'Ongkir',
      'Total Masuk'
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

    // Populate Clean Data Rows (Without trailing total row)
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

      for (let column = 8; column <= 13; column++) {
        dataRow.getCell(column).numFmt = CURRENCY_FORMAT;
        dataRow.getCell(column).alignment = { horizontal: 'right', vertical: 'middle' };
      }

      for (let column = 1; column <= 13; column++) {
        dataRow.getCell(column).border = BORDER_THIN;
      }
    });

    const lastDataRowNumber = 4 + rows.length;
    detailSheet.autoFilter = { from: 'A4', to: `M${lastDataRowNumber}` };

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const productLabel = selectedProducts.length === 0
      ? 'Semua_Produk'
      : selectedProducts.join('-').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 60);
    const fileName = `Laporan_Eksekutif_Penjualan_${startDate}_${endDate}_${productLabel}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Laporan Excel profesional berhasil diunduh.');
  } catch (error) {
    console.error('Failed to generate Excel report:', error);
    toast.error('Gagal mengekspor laporan Excel. Silakan coba kembali.');
  }
}
