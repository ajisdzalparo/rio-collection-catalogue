const STANDARD_SIZE_ORDER: Record<string, number> = {
  XXS: 10,
  '2XS': 10,
  XS: 20,
  'EXTRA SMALL': 20,
  S: 30,
  SMALL: 30,
  M: 40,
  MEDIUM: 40,
  L: 50,
  LARGE: 50,
  XL: 60,
  'EXTRA LARGE': 60,
  '1X': 60,
  '1XL': 60,
  XXL: 70,
  '2XL': 70,
  '2X': 70,
  XXXL: 80,
  '3XL': 80,
  '3X': 80,
  '4XL': 90,
  '4X': 90,
  '5XL': 100,
  '5X': 100,
  '6XL': 110,
  'ALL SIZE': 200,
  ALLSIZE: 200,
  ONESIZE: 200,
  'ONE SIZE': 200,
  'FREE SIZE': 200,
  FREESIZE: 200
};

export function getSizeWeight(sizeName: string): number {
  if (!sizeName) return 999;
  const normalized = sizeName.trim().toUpperCase();

  if (STANDARD_SIZE_ORDER[normalized] !== undefined) {
    return STANDARD_SIZE_ORDER[normalized];
  }

  const numericVal = parseFloat(normalized);
  if (!isNaN(numericVal)) {
    return 300 + numericVal;
  }

  return 999;
}

/**
 * Sort an array of items by their size string representation.
 */
export function sortSizes<T>(
  items: T[],
  getSizeKey: (item: T) => string = (item) => String(item)
): T[] {
  return [...items].sort((a, b) => {
    const sizeA = getSizeKey(a);
    const sizeB = getSizeKey(b);
    const weightA = getSizeWeight(sizeA);
    const weightB = getSizeWeight(sizeB);

    if (weightA !== weightB) {
      return weightA - weightB;
    }

    return sizeA.localeCompare(sizeB, undefined, { numeric: true, sensitivity: 'base' });
  });
}
