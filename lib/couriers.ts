export interface CourierDefinition {
  code: string;
  name: string;
  description: string;
}

export interface CourierOption {
  value: string;
  label: string;
}

export const DEFAULT_ENABLED_COURIERS = 'jne,pos,tiki,sicepat,jnt';

export const COURIERS: readonly CourierDefinition[] = [
  { code: 'jne', name: 'JNE Express', description: 'Jalur Nugraha Ekakurir' },
  { code: 'pos', name: 'POS Indonesia', description: 'PT POS Indonesia' },
  { code: 'tiki', name: 'TIKI', description: 'Titipan Kilat' },
  { code: 'sicepat', name: 'SiCepat Ekspres', description: 'SiCepat Ekspres Indonesia' },
  { code: 'jnt', name: 'J&T Express', description: 'J&T Express Indonesia' },
  { code: 'anteraja', name: 'Anteraja', description: 'PT Tri Adi Bersama' },
  { code: 'wahana', name: 'Wahana Express', description: 'Wahana Prestasi Logistik' },
  { code: 'lion', name: 'Lion Parcel', description: 'Lion Parcel' },
  { code: 'ninja', name: 'Ninja Xpress', description: 'Ninja Logistics' },
  { code: 'ide', name: 'ID Express', description: 'ID Express Indonesia' }
] as const;

export function parseEnabledCourierCodes(value?: string | null): string[] {
  return (value || DEFAULT_ENABLED_COURIERS)
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
}

export function getEnabledCourierOptions(
  enabledCouriers?: string | null,
  currentCourier?: string | null
): CourierOption[] {
  const enabledCodes = new Set(parseEnabledCourierCodes(enabledCouriers));
  const options = COURIERS.filter((courier) => enabledCodes.has(courier.code)).map((courier) => ({
    value: courier.name,
    label: courier.name
  }));

  const current = currentCourier?.trim();
  if (current && !options.some((option) => option.value === current)) {
    options.unshift({ value: current, label: `${current} (data order)` });
  }

  return options;
}
