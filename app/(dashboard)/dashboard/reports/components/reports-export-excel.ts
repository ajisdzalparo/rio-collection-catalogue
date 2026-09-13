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
const CURRENCY_FORMAT = '"Rp" #,##0;[Red]("Rp" #,##0);-';
const NUMBER_FORMAT = '#,##0';

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
    workbook.creator = 'RIO Collection';
    workbook.created = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    const worksheet = workbook.addWorksheet('Transaksi', {
      views: [{ state: 'frozen', ySplit: 5, showGridLines: true }]
    });

    worksheet.columns = [
      { key: 'date', width: 14 },
      { key: 'orderNumber', width: 23 },
      { key: 'status', width: 12 },
      { key: 'customer', width: 24 },
      { key: 'product', width: 32 },
      { key: 'size', width: 10 },
      { key: 'quantity', width: 10 },
      { key: 'unitPrice', width: 16 },
      { key: 'sales', width: 18 },
      { key: 'cogs', width: 18 },
      { key: 'grossProfit', width: 19 },
      { key: 'shippingFee', width: 15 },
      { key: 'received', width: 18 }
    ];

    worksheet.mergeCells('A1:M1');
    worksheet.getCell('A1').value = 'Laporan Penjualan';
    worksheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true };
    worksheet.getCell('A2').value = 'Periode';
    worksheet.getCell('B2').value = `${startDate} s.d. ${endDate}`;
    worksheet.getCell('D2').value = 'Produk';
    worksheet.getCell('E2').value = selectedProducts.length === 0
      ? 'Semua produk'
      : safeExcelText(selectedProducts.join(', '));
    worksheet.getCell('G2').value = 'Jumlah order';
    worksheet.getCell('H2').value = new Set(rows.map((row) => row.orderNumber)).size;
    worksheet.getCell('H2').numFmt = NUMBER_FORMAT;
    worksheet.getCell('J2').value = 'Status';
    worksheet.getCell('K2').value = selectedStatuses.length === 0
      ? 'Lunas, Dikirim'
      : selectedStatuses.map(getStatusLabel).join(', ');

    const notes = [
      'Hanya order Lunas dan Dikirim yang dicatat.',
      'HPP mengikuti master produk saat laporan diekspor.'
    ];
    notes.push(
      selectedProducts.length === 0
        ? 'Ongkir dicatat satu kali per pesanan.'
        : 'Ongkir tidak dialokasikan saat laporan difilter per produk.'
    );
    if (usesDefaultHpp) notes.push(`HPP kosong memakai nilai default Rp ${DEFAULT_HPP.toLocaleString('id-ID')}.`);
    worksheet.mergeCells('A3:M3');
    worksheet.getCell('A3').value = notes.join(' ');
    worksheet.getCell('A3').font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF6B7280' } };

    const headers = [
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
    const headerRow = worksheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    rows.forEach((row) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 20;
      dataRow.font = { name: 'Arial', size: 10 };
      dataRow.getCell(1).numFmt = 'dd mmm yyyy';
      dataRow.getCell(7).numFmt = NUMBER_FORMAT;
      for (let column = 8; column <= 13; column++) {
        dataRow.getCell(column).numFmt = CURRENCY_FORMAT;
      }
      for (let column = 7; column <= 13; column++) {
        dataRow.getCell(column).alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    const firstDataRow = 6;
    const lastDataRow = firstDataRow + rows.length - 1;
    const totalRowNumber = lastDataRow + 1;
    const totalRow = worksheet.getRow(totalRowNumber);
    totalRow.values = [
      'TOTAL', '', '', '', '', '',
      { formula: `SUM(G${firstDataRow}:G${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.quantity, 0) },
      '',
      { formula: `SUM(I${firstDataRow}:I${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.sales, 0) },
      { formula: `SUM(J${firstDataRow}:J${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.cogs, 0) },
      { formula: `SUM(K${firstDataRow}:K${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.grossProfit, 0) },
      { formula: `SUM(L${firstDataRow}:L${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.shippingFee, 0) },
      { formula: `SUM(M${firstDataRow}:M${lastDataRow})`, result: rows.reduce((sum, row) => sum + row.received, 0) }
    ];
    totalRow.font = { name: 'Arial', size: 10, bold: true };
    totalRow.border = { top: { style: 'double', color: { argb: 'FF374151' } } };
    totalRow.getCell(7).numFmt = NUMBER_FORMAT;
    for (let column = 9; column <= 13; column++) totalRow.getCell(column).numFmt = CURRENCY_FORMAT;

    worksheet.autoFilter = { from: 'A5', to: `M${lastDataRow}` };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const productLabel = selectedProducts.length === 0
      ? 'Semua_Produk'
      : selectedProducts.join('-').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 60);
    const fileName = `Laporan_Penjualan_${startDate}_${endDate}_${productLabel}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Laporan Excel sederhana berhasil diunduh.');
  } catch (error) {
    console.error('Failed to generate Excel report:', error);
    toast.error('Gagal mengekspor laporan Excel. Silakan coba kembali.');
  }
}
