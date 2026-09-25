/**
 * Code 128B Barcode Generator (Pure TypeScript)
 * Produces crisp SVG vector barcodes without external dependencies.
 */

// Code 128 patterns for values 0-106 (each pattern has 11 modules except Stop which has 13)
// 1 = bar, 0 = space
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface BarcodeOptions {
  width?: number;
  height?: number;
  showText?: boolean;
  fontSize?: number;
}

export function generateBarcodeSvg(text: string, options: BarcodeOptions = {}): string {
  const { height = 50, showText = true, fontSize = 11 } = options;
  const cleanText = text.replace(/[^\x20-\x7E]/g, '');

  if (!cleanText) {
    return '';
  }

  // Calculate Code 128B values
  const values: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const val = cleanText.charCodeAt(i) - 32;
    values.push(val);
    checksum += val * (i + 1);
  }

  const checkValue = checksum % 103;
  values.push(checkValue);
  values.push(STOP_CODE);

  // Convert pattern codes to bars and spaces
  let binaryString = '';
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val];
    if (!pattern) continue;
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      binaryString += (isBar ? '1' : '0').repeat(width);
      isBar = !isBar;
    }
  }

  // Quiet zones (10 modules each side)
  const quietZone = 10;
  const totalModules = binaryString.length + quietZone * 2;
  const moduleWidth = 2; // SVG viewBox units per module
  const svgWidth = totalModules * moduleWidth;
  const svgHeight = height + (showText ? fontSize + 8 : 0);

  // Build SVG rects
  let rects = '';
  let x = quietZone * moduleWidth;

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      rects += `<rect x="${x}" y="0" width="${moduleWidth}" height="${height}" fill="#000000"/>`;
    }
    x += moduleWidth;
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${height + fontSize + 2}" font-family="monospace, monospace" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#000000" letter-spacing="1">${cleanText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}" preserveAspectRatio="xMidYMid meet" style="display:block;max-width:${svgWidth}px;margin:0 auto;">${rects}${textElement}</svg>`;
}
