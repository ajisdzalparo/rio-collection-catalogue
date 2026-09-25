/**
 * Web Bluetooth Thermal Printer & ESC/POS Command Encoder
 * Supports 58mm (32 characters/line) and 80mm (48 characters/line) POS printers.
 */

export type PaperSize = '58mm' | '80mm';

export interface PrinterSettings {
  paperSize: PaperSize;
  autoCut: boolean;
  lastDeviceName?: string;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperSize: '58mm',
  autoCut: true
};

const STORAGE_KEY = 'rio_printer_settings';

export function getSavedPrinterSettings(): PrinterSettings {
  if (typeof window === 'undefined') return DEFAULT_PRINTER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export function savePrinterSettings(settings: PrinterSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save printer settings:', err);
  }
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Standard Bluetooth SPP & Printer UUIDs
 */
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Generic mobile printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common serial
  '0000ae00-0000-1000-8000-00805f9b34fb'
];

/**
 * ESC/POS Command Constants
 */
const ESC = 0x1b;
const GS = 0x1d;

export class EscPosEncoder {
  private buffer: number[] = [];
  private charsPerLine: number;

  constructor(paperSize: PaperSize = '58mm') {
    this.charsPerLine = paperSize === '80mm' ? 48 : 32;
    this.init();
  }

  init(): this {
    this.buffer.push(ESC, 0x40); // Initialize printer
    return this;
  }

  align(alignment: 'left' | 'center' | 'right'): this {
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(ESC, 0x61, code);
    return this;
  }

  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  doubleSize(enable: boolean): this {
    this.buffer.push(GS, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 63); // sanitize ASCII
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  separator(char: string = '-'): this {
    this.line(char.repeat(this.charsPerLine));
    return this;
  }

  row(left: string, right: string): this {
    const maxLeft = this.charsPerLine - right.length - 1;
    const truncatedLeft = left.length > maxLeft ? left.slice(0, maxLeft) : left;
    const spaceCount = Math.max(1, this.charsPerLine - truncatedLeft.length - right.length);
    this.line(truncatedLeft + ' '.repeat(spaceCount) + right);
    return this;
  }

  cut(): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, 0x01); // GS V 1 (Partial cut)
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export interface InvoicePrintData {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  courierName?: string;
  trackingNumber?: string;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalPrice: number;
  bankDetails?: string;
}

/**
 * Builds ESC/POS binary data for an order
 */
export function buildOrderReceiptBytes(
  data: InvoicePrintData,
  settings: PrinterSettings
): Uint8Array {
  const encoder = new EscPosEncoder(settings.paperSize);

  // 1. Header (Store Info)
  encoder
    .align('center')
    .bold(true)
    .doubleSize(true)
    .line(data.storeName.toUpperCase())
    .doubleSize(false)
    .bold(false);

  if (data.storeAddress) {
    encoder.line(data.storeAddress);
  }
  if (data.storePhone) {
    encoder.line(`WA: ${data.storePhone}`);
  }

  encoder.separator('=');

  // 2. Order Meta
  encoder
    .align('left')
    .bold(true)
    .line(`NO: #${data.orderNumber}`)
    .bold(false)
    .line(
      `TGL: ${new Date(data.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    )
    .line(`STATUS: ${data.status.toUpperCase()}`);

  encoder.separator('-');

  // 3. Customer Info
  encoder
    .line(`PELANGGAN: ${data.customerName}`)
    .line(`NO HP: ${data.customerPhone}`)
    .line(`KIRIM: ${data.courierName || 'Reguler'}`);

  if (data.trackingNumber) {
    encoder.line(`RESI: ${data.trackingNumber}`);
  }

  encoder.separator('-');

  // 4. Items Table
  encoder.bold(true).line('ITEM PESANAN:').bold(false);

  data.items.forEach((item) => {
    const itemTitle = item.variant ? `${item.name} (${item.variant})` : item.name;
    encoder.line(itemTitle);
    const qtyPrice = ` ${item.quantity}x @Rp ${item.price.toLocaleString('id-ID')}`;
    const itemTotal = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
    encoder.row(qtyPrice, itemTotal);
  });

  encoder.separator('-');

  // 5. Total Breakdown
  encoder
    .row('Subtotal Item', `Rp ${data.subtotal.toLocaleString('id-ID')}`)
    .row(
      `Ongkir (${data.courierName || 'Kurir'})`,
      `Rp ${data.shippingFee.toLocaleString('id-ID')}`
    );

  if (data.discount > 0) {
    encoder.row('Diskon Voucher', `-Rp ${data.discount.toLocaleString('id-ID')}`);
  }

  encoder.separator('=');

  encoder
    .bold(true)
    .doubleSize(true)
    .row('TOTAL', `Rp ${data.totalPrice.toLocaleString('id-ID')}`)
    .doubleSize(false)
    .bold(false);

  encoder.separator('=');

  // 6. Footer Notes
  encoder
    .align('center')
    .line('Terima kasih atas pesanan Anda!')
    .line(`Simpan struk ini sebagai bukti resmi.`)
    .feed(1);

  if (settings.autoCut) {
    encoder.cut();
  } else {
    encoder.feed(3);
  }

  return encoder.getBytes();
}

/**
 * Connects to a Bluetooth Thermal Printer and prints the receipt data.
 */
export async function printViaWebBluetooth(
  data: InvoicePrintData,
  settings: PrinterSettings
): Promise<{
  success: boolean;
  deviceName?: string;
  error?: string;
  isGloballyDisabled?: boolean;
}> {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      isGloballyDisabled: true,
      error:
        'Web Bluetooth API tidak didukung oleh browser ini. Gunakan Google Chrome, Microsoft Edge, atau Opera.'
    };
  }

  try {
    // Request device
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES
    });

    if (!device || !device.gatt) {
      return { success: false, error: 'Perangkat Bluetooth tidak terpilih.' };
    }

    const deviceName = device.name || 'Printer Bluetooth';

    // Connect GATT server
    const server = await device.gatt.connect();

    // Find printable characteristic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetCharacteristic: any = null;

    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetCharacteristic = char;
            break;
          }
        }
        if (targetCharacteristic) break;
      } catch {
        // Try next service
      }
    }

    if (!targetCharacteristic) {
      // Fallback: try all discovered services
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        }
      } catch {
        // Ignore fallback discovery error
      }
    }

    if (!targetCharacteristic) {
      if (device.gatt.connected) device.gatt.disconnect();
      return {
        success: false,
        error: `Terhubung ke "${deviceName}", tetapi tidak menemukan karakteristik cetak (write characteristic). Pastikan printer dalam mode ESC/POS.`
      };
    }

    // Build raw ESC/POS bytes
    const receiptBytes = buildOrderReceiptBytes(data, settings);

    // Send chunks (max 512 bytes per Bluetooth LE packet)
    const chunkSize = 128;
    for (let i = 0; i < receiptBytes.length; i += chunkSize) {
      const chunk = receiptBytes.slice(i, i + chunkSize);
      if (targetCharacteristic.writeValueWithoutResponse) {
        await targetCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await targetCharacteristic.writeValue(chunk);
      }
      // Small delay between packets to prevent buffer overflow in thermal printers
      await new Promise((res) => setTimeout(res, 25));
    }

    // Save device name preference
    savePrinterSettings({ ...settings, lastDeviceName: deviceName });

    // Disconnect after slight delay to ensure buffer is printed
    setTimeout(() => {
      try {
        if (device.gatt.connected) device.gatt.disconnect();
      } catch {
        // ignore
      }
    }, 1000);

    return { success: true, deviceName };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : '';

    if (
      errorMsg.toLowerCase().includes('cancelled') ||
      errorMsg.toLowerCase().includes('canceled') ||
      errorName === 'AbortError'
    ) {
      return { success: false, error: 'Pemilihan printer dibatalkan.' };
    }

    if (
      errorMsg.toLowerCase().includes('globally disabled') ||
      errorMsg.toLowerCase().includes('disabled') ||
      errorMsg.toLowerCase().includes('not supported') ||
      errorName === 'SecurityError'
    ) {
      return {
        success: false,
        isGloballyDisabled: true,
        error:
          'Web Bluetooth API dinonaktifkan oleh browser. Sistem otomatis mengalihkan ke dialog cetak printer bawaan sistem.'
      };
    }

    return { success: false, error: errorMsg };
  }
}
