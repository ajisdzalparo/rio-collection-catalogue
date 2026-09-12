import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import type { Order } from '@/hooks/use-orders';

interface ExportExcelParams {
  currentOrders: Order[];
  selectedProduct: string;
  startDate: string;
  endDate: string;
}

export async function exportReportToExcel({
  currentOrders,
  selectedProduct,
  startDate,
  endDate
}: ExportExcelParams): Promise<void> {
  if (currentOrders.length === 0) {
    toast.error('Tidak ada data penjualan pada rentang tanggal dan produk yang dipilih.');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RIO Collection Management System';
    workbook.lastModifiedBy = 'RIO Collection Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Laporan Penjualan', {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 5 }]
    });

    // Restrained monochrome palette (ARGB)
    const INK_COLOR = 'FF111827';
    const MUTED_COLOR = 'FF6B7280';
    const HEADER_FILL = 'FF1F2937';
    const SUBTLE_FILL = 'FFF3F4F6';
    const BORDER_COLOR = 'FFE5E7EB';
    const STRONG_BORDER_COLOR = 'FF9CA3AF';
    const WHITE_COLOR = 'FFFFFFFF';
    const FONT_NAME = 'Arial';

    // Standard Currency and Number Formats
    const CURRENCY_FORMAT = '"Rp" #,##0;("Rp" #,##0);"-"';
    const NUMBER_FORMAT = '#,##0';
    const PERCENT_FORMAT = '0.0%';

    // Define Columns with Explicit Widths
    worksheet.columns = [
      { key: 'orderNumber', width: 25 },   // A: No. Pesanan
      { key: 'date', width: 14 },          // B: Tanggal
      { key: 'time', width: 10 },          // C: Waktu
      { key: 'customerName', width: 24 },  // D: Nama Pelanggan
      { key: 'whatsapp', width: 18 },      // E: WhatsApp
      { key: 'status', width: 15 },        // F: Status
      { key: 'productName', width: 32 },   // G: Nama Produk
      { key: 'size', width: 10 },          // H: Ukuran
      { key: 'quantity', width: 12 },      // I: Qty (Pcs)
      { key: 'unitPrice', width: 18 },     // J: Harga Satuan (Rp)
      { key: 'revenue', width: 20 },       // K: Total Omset (Rp)
      { key: 'cogs', width: 20 },          // L: Total HPP (Rp)
      { key: 'profit', width: 22 },        // M: Estimasi Laba Kotor (Rp)
      { key: 'margin', width: 14 },        // N: Margin (%)
      { key: 'address', width: 52 }        // O: Alamat Pengiriman
    ];

    // ==========================================
    // ROW 1 - 3: Corporate Header & Metadata
    // ==========================================
    worksheet.mergeCells('A1:O1');
    const titleCell1 = worksheet.getCell('A1');
    titleCell1.value = 'LAPORAN PENJUALAN';
    titleCell1.font = { name: FONT_NAME, size: 15, bold: true, color: { argb: INK_COLOR } };
    titleCell1.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells('A2:O2');
    const titleCell2 = worksheet.getCell('A2');
    const cleanProdLabel = selectedProduct === 'ALL' ? 'Semua Produk Kaos' : selectedProduct;
    titleCell2.value = `RIO COLLECTION  •  Periode ${startDate} s.d. ${endDate}  •  ${cleanProdLabel}`;
    titleCell2.font = { name: FONT_NAME, size: 10, color: { argb: INK_COLOR } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(2).height = 18;

    worksheet.mergeCells('A3:O3');
    const titleCell3 = worksheet.getCell('A3');
    const printDateStr = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    titleCell3.value = `Dibuat ${printDateStr} WIB`;
    titleCell3.font = { name: FONT_NAME, size: 9, italic: true, color: { argb: MUTED_COLOR } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(3).height = 16;

    // Row 4 is blank separator
    worksheet.getRow(4).height = 10;

    // ==========================================
    // ROW 5: Column Headers
    // ==========================================
    const headers = [
      'No. Pesanan',
      'Tanggal',
      'Waktu',
      'Nama Pelanggan',
      'WhatsApp',
      'Status',
      'Nama Produk',
      'Ukuran',
      'Qty (Pcs)',
      'Harga Satuan (Rp)',
      'Total Omset (Rp)',
      'Total HPP (Rp)',
      'Estimasi Laba Kotor (Rp)',
      'Margin (%)',
      'Alamat Pengiriman'
    ];

    const headerRow = worksheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_FILL }
      };
      cell.font = {
        name: FONT_NAME,
        size: 10,
        bold: true,
        color: { argb: WHITE_COLOR }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: INK_COLOR } },
        right: { style: 'thin', color: { argb: STRONG_BORDER_COLOR } }
      };
    });

    // Left-align text column headers for better hierarchy
    worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getCell('D5').alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getCell('G5').alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getCell('O5').alignment = { vertical: 'middle', horizontal: 'left' };

    // Right-align numeric column headers
    worksheet.getCell('I5').alignment = { vertical: 'middle', horizontal: 'right' };
    worksheet.getCell('J5').alignment = { vertical: 'middle', horizontal: 'right' };
    worksheet.getCell('K5').alignment = { vertical: 'middle', horizontal: 'right' };
    worksheet.getCell('L5').alignment = { vertical: 'middle', horizontal: 'right' };
    worksheet.getCell('M5').alignment = { vertical: 'middle', horizontal: 'right' };
    worksheet.getCell('N5').alignment = { vertical: 'middle', horizontal: 'right' };

    // ==========================================
    // AutoFilter: Enable sort & filter on header
    // ==========================================
    worksheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5, column: 15 }
    };

    // ==========================================
    // ROW 6+: Data Rows with Excel Formulas
    // ==========================================
    const startDataRow = 6;
    let currentRowIndex = startDataRow;

    let initialTotalQty = 0;
    let initialTotalRev = 0;
    let initialTotalHpp = 0;
    let initialTotalProfit = 0;
    let initialMaxRev = 0;

    currentOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        const profit = rev - hpp;
        const margin = rev > 0 ? profit / rev : 0;

        initialTotalQty += item.quantity;
        initialTotalRev += rev;
        initialTotalHpp += hpp;
        initialTotalProfit += profit;
        initialMaxRev = Math.max(initialMaxRev, rev);

        const dateObj = new Date(order.createdAt);
        const timeValue = (dateObj.getHours() * 60 + dateObj.getMinutes()) / (24 * 60);

        const rNum = currentRowIndex;
        const dataRow = worksheet.getRow(rNum);
        const addressLength = order.address?.length ?? 0;
        dataRow.height = addressLength > 90 ? 38 : addressLength > 50 ? 30 : 22;

        dataRow.values = [
          order.orderNumber || '-',                            // A: No. Pesanan
          dateObj,                                             // B: Tanggal
          timeValue,                                           // C: Waktu
          order.fullName || '-',                               // D: Nama Pelanggan
          order.whatsapp || '-',                               // E: WhatsApp
          order.status || '-',                                 // F: Status
          item.name || '-',                                    // G: Nama Produk
          item.size || '-',                                    // H: Ukuran
          item.quantity ?? 0,                                  // I: Qty (Pcs)
          item.price ?? 0,                                     // J: Harga Satuan (Rp)
          { formula: `I${rNum}*J${rNum}`, result: rev },      // K: Total Omset Formula
          hpp,                                                 // L: Total HPP
          { formula: `K${rNum}-L${rNum}`, result: profit },   // M: Estimasi Laba Formula
          { formula: `IF(K${rNum}>0, M${rNum}/K${rNum}, 0)`, result: margin }, // N: Margin Formula
          order.address || '-'                                 // O: Alamat
        ];

        // Format and style individual data cells
        dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: FONT_NAME, size: 9.5, color: { argb: INK_COLOR } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE_COLOR } };
          cell.border = {
            top: { style: 'thin', color: { argb: BORDER_COLOR } },
            left: { style: 'thin', color: { argb: BORDER_COLOR } },
            bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
            right: { style: 'thin', color: { argb: BORDER_COLOR } }
          };

          // Alignment and number formatting rules per column
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: FONT_NAME, size: 9.5, bold: true, color: { argb: INK_COLOR } };
          } else if (colNumber === 2 || colNumber === 3) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.numFmt = colNumber === 2 ? 'dd mmm yyyy' : 'hh:mm';
          } else if (colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else if (colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.numFmt = '@';
          } else if (colNumber === 6) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: FONT_NAME, size: 9, bold: true, color: { argb: INK_COLOR } };
          } else if (colNumber === 7) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: FONT_NAME, size: 9.5, bold: true, color: { argb: INK_COLOR } };
          } else if (colNumber === 8) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (colNumber === 9) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = NUMBER_FORMAT;
          } else if (colNumber === 10 || colNumber === 11 || colNumber === 12 || colNumber === 13) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = CURRENCY_FORMAT;
          } else if (colNumber === 14) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = PERCENT_FORMAT;
          } else if (colNumber === 15) {
            cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
          }
        });

        currentRowIndex++;
      });
    });

    const endDataRow = currentRowIndex - 1;

    // ==========================================
    // GRAND TOTAL ROW (With Accounting Double Border)
    // ==========================================
    const totalRow = worksheet.getRow(currentRowIndex);
    totalRow.height = 26;

    const grandMargin = initialTotalRev > 0 ? initialTotalProfit / initialTotalRev : 0;

    totalRow.values = [
      'TOTAL KESELURUHAN',                                                                // A
      '',                                                                                 // B
      '',                                                                                 // C
      '',                                                                                 // D
      '',                                                                                 // E
      '',                                                                                 // F
      '',                                                                                 // G
      '',                                                                                 // H
      { formula: `SUM(I${startDataRow}:I${endDataRow})`, result: initialTotalQty },        // I: Total Qty
      '',                                                                                 // J
      { formula: `SUM(K${startDataRow}:K${endDataRow})`, result: initialTotalRev },        // K: Total Omset
      { formula: `SUM(L${startDataRow}:L${endDataRow})`, result: initialTotalHpp },        // L: Total HPP
      { formula: `SUM(M${startDataRow}:M${endDataRow})`, result: initialTotalProfit },     // M: Total Laba
      { formula: `IF(K${currentRowIndex}>0, M${currentRowIndex}/K${currentRowIndex}, 0)`, result: grandMargin }, // N: Margin
      ''                                                                                  // O
    ];

    // Merge A to H for "TOTAL KESELURUHAN" label
    worksheet.mergeCells(`A${currentRowIndex}:H${currentRowIndex}`);

    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTLE_FILL } };
      cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: INK_COLOR } };
      cell.border = {
        top: { style: 'medium', color: { argb: STRONG_BORDER_COLOR } },
        bottom: { style: 'double', color: { argb: INK_COLOR } }
      };

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = NUMBER_FORMAT;
      } else if (colNumber === 11 || colNumber === 12 || colNumber === 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = CURRENCY_FORMAT;
      } else if (colNumber === 14) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = PERCENT_FORMAT;
      }
    });

    // ==========================================
    // SUMMARY EXECUTIVE STATS CARD (Rows below)
    // ==========================================
    const statsStartRow = currentRowIndex + 3;

    worksheet.mergeCells(`B${statsStartRow}:E${statsStartRow}`);
    const statHeader = worksheet.getCell(`B${statsStartRow}`);
    statHeader.value = 'IKHTISAR EKSEKUTIF PENJUALAN';
    statHeader.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: INK_COLOR } };
    statHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTLE_FILL } };
    statHeader.alignment = { vertical: 'middle', horizontal: 'left' };
    statHeader.border = { bottom: { style: 'medium', color: { argb: STRONG_BORDER_COLOR } } };
    worksheet.getRow(statsStartRow).height = 22;

    const statsItems = [
      {
        label: 'Total Baris Transaksi',
        formula: `COUNTA(A${startDataRow}:A${endDataRow})`,
        result: endDataRow - startDataRow + 1,
        format: '#,##0 "Baris"'
      },
      {
        label: 'Rata-rata Penjualan per Baris (AOV)',
        formula: `AVERAGE(K${startDataRow}:K${endDataRow})`,
        result: initialTotalRev / Math.max(1, endDataRow - startDataRow + 1),
        format: CURRENCY_FORMAT
      },
      {
        label: 'Omset Tertinggi dalam 1 Transaksi',
        formula: `MAX(K${startDataRow}:K${endDataRow})`,
        result: initialMaxRev,
        format: CURRENCY_FORMAT
      },
      {
        label: 'Rata-rata Margin Laba Kotor',
        formula: `AVERAGE(N${startDataRow}:N${endDataRow})`,
        result: grandMargin,
        format: PERCENT_FORMAT
      }
    ];

    statsItems.forEach((stat, sIdx) => {
      const sRowNum = statsStartRow + 1 + sIdx;
      worksheet.getRow(sRowNum).height = 20;

      worksheet.mergeCells(`B${sRowNum}:D${sRowNum}`);
      const lblCell = worksheet.getCell(`B${sRowNum}`);
      lblCell.value = stat.label;
      lblCell.font = { name: FONT_NAME, size: 9, color: { argb: INK_COLOR } };
      lblCell.alignment = { vertical: 'middle', horizontal: 'left' };
      lblCell.border = {
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } }
      };

      const valCell = worksheet.getCell(`E${sRowNum}`);
      valCell.value = { formula: stat.formula, result: stat.result };
      valCell.font = { name: FONT_NAME, size: 9.5, bold: true, color: { argb: INK_COLOR } };
      valCell.alignment = { vertical: 'middle', horizontal: 'right' };
      valCell.numFmt = stat.format;
      valCell.border = {
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } }
      };
    });

    // Write file to buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const cleanProdName =
      selectedProduct === 'ALL' ? 'Semua_Produk' : selectedProduct.replace(/\s+/g, '_');
    const fileName = `Laporan_Penjualan_RIO_${startDate}_sd_${endDate}_${cleanProdName}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    toast.success('Laporan Excel berstandar perusahaan berhasil diunduh.');
  } catch (error) {
    console.error('Failed to generate professional Excel report:', error);
    toast.error('Gagal mengekspor laporan Excel. Silakan coba kembali.');
  }
}
