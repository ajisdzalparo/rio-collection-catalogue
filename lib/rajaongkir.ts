import {
  INDONESIA_MASTER_LOCATIONS,
  getMasterCitiesForProvince,
  getFallbackSubdistricts
} from './indonesia-locations';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface RajaOngkirProvince {
  province_id: string;
  province: string;
}

export interface RajaOngkirCity {
  city_id: string;
  province_id: string;
  province: string;
  type: string; // 'Kota' | 'Kabupaten'
  city_name: string;
  postal_code: string;
}

export interface RajaOngkirSubdistrict {
  subdistrict_id: string;
  province_id: string;
  province: string;
  city_id: string;
  city: string;
  type: string;
  subdistrict_name: string;
  district_name?: string;
  village_name?: string;
  postal_code?: string;
}

export interface RajaOngkirCostService {
  service: string;
  description: string;
  cost: Array<{
    value: number;
    etd: string;
    note: string;
  }>;
}

export interface RajaOngkirCourierResult {
  code: string;
  name: string;
  costs: RajaOngkirCostService[];
}

const getApiKey = () => process.env.RAJAONGKIR_API_KEY || '';
const getV2BaseUrl = () => 'https://rajaongkir.komerce.id/api/v1';

const getV1BaseUrl = () => {
  const accountType = process.env.RAJAONGKIR_ACCOUNT_TYPE || 'starter';
  if (accountType === 'pro') return 'https://pro.rajaongkir.com/api';
  if (accountType === 'basic') return 'https://api.rajaongkir.com/basic';
  return 'https://api.rajaongkir.com/starter';
};

const baseRegionalRates: Record<string, number> = {
  'DKI JAKARTA': 12000,
  'JAWA BARAT': 14000,
  BANTEN: 13000,
  'JAWA TENGAH': 16000,
  'DI YOGYAKARTA': 16000,
  'JAWA TIMUR': 18000,
  BALI: 22000,
  'SUMATERA UTARA': 28000,
  'SUMATERA BARAT': 28000,
  'SUMATERA SELATAN': 25000,
  RIAU: 30000,
  'KEPULAUAN RIAU': 32000,
  JAMBI: 27000,
  BENGKULU: 28000,
  LAMPUNG: 22000,
  ACEH: 35000,
  'KALIMANTAN BARAT': 35000,
  'KALIMANTAN SELATAN': 35000,
  'KALIMANTAN TIMUR': 38000,
  'KALIMANTAN TENGAH': 36000,
  'KALIMANTAN UTARA': 42000,
  'SULAWESI UTARA': 45000,
  'SULAWESI SELATAN': 38000,
  'SULAWESI TENGAH': 42000,
  'SULAWESI TENGGARA': 44000,
  GORONTALO: 46000,
  'NUSA TENGGARA BARAT': 28000,
  'NUSA TENGGARA TIMUR': 35000,
  MALUKU: 55000,
  'MALUKU UTARA': 58000,
  PAPUA: 70000,
  'PAPUA BARAT': 72000
};

const courierServicePresets: Record<
  string,
  Array<{ service: string; desc: string; etd: string; delta: number }>
> = {
  jne: [
    { service: 'JNE REG', desc: 'Layanan Reguler', etd: '2-3 Hari', delta: 0 },
    { service: 'JNE YES', desc: 'Yakin Esok Sampai', etd: '1 Hari', delta: 15000 },
    { service: 'JTR', desc: 'JNE Trucking Cargo', etd: '3-5 Hari', delta: 8000 }
  ],
  pos: [{ service: 'POS Kilat Khusus', desc: 'Pos Kilat Khusus', etd: '2-4 Hari', delta: -2000 }],
  tiki: [
    { service: 'TIKI REG', desc: 'Reguler Service', etd: '2-3 Hari', delta: 0 },
    { service: 'TIKI ONS', desc: 'Over Night Service', etd: '1 Hari', delta: 14000 }
  ],
  sicepat: [
    { service: 'SiCepat REG', desc: 'Reguler Package', etd: '2-3 Hari', delta: 0 },
    { service: 'SiCepat BEST', desc: 'Besok Sampai Tujuan', etd: '1 Hari', delta: 12000 }
  ],
  jnt: [{ service: 'J&T EZ', desc: 'Reguler Express', etd: '2-3 Hari', delta: 2000 }],
  anteraja: [
    { service: 'Anteraja Reguler', desc: 'Layanan Reguler', etd: '2-3 Hari', delta: 1000 },
    { service: 'Anteraja Next Day', desc: 'Layanan Next Day', etd: '1 Hari', delta: 13000 }
  ],
  wahana: [{ service: 'Wahana Express', desc: 'Layanan Ekonomis', etd: '3-4 Hari', delta: -4000 }],
  lion: [{ service: 'Lion REGPACK', desc: 'Reguler Package', etd: '2-3 Hari', delta: 0 }],
  ninja: [{ service: 'Ninja Standard', desc: 'Standard Delivery', etd: '2-3 Hari', delta: 0 }],
  ide: [{ service: 'ID Express Standard', desc: 'Standard Delivery', etd: '2-3 Hari', delta: 0 }]
};

export function getOfflineCalculatedRate(
  destinationId: string,
  courierCode: string,
  weightGrams: number
): RajaOngkirCourierResult[] {
  let provinceName = 'DKI JAKARTA';
  for (const [prov, cities] of Object.entries(INDONESIA_MASTER_LOCATIONS)) {
    if (
      cities.some(
        (c) =>
          c.defaultId === destinationId ||
          c.name.toLowerCase() === destinationId.toLowerCase() ||
          destinationId.toLowerCase().includes(c.name.toLowerCase())
      )
    ) {
      provinceName = prov;
      break;
    }
  }

  const baseFee = baseRegionalRates[provinceName] || 25000;
  const weightMultiplier = Math.max(1, Math.ceil(weightGrams / 1000));
  const presets = courierServicePresets[courierCode] || [
    { service: `${courierCode.toUpperCase()} REG`, desc: 'Reguler', etd: '2-3 Hari', delta: 0 }
  ];

  return [
    {
      code: courierCode.toUpperCase(),
      name: courierCode.toUpperCase(),
      costs: presets.map((p) => ({
        service: p.service,
        description: p.desc,
        cost: [
          {
            value: Math.max(10000, baseFee + p.delta) * weightMultiplier,
            etd: p.etd,
            note: ''
          }
        ]
      }))
    }
  ];
}

/**
 * Fetch provinces from offline master location data (0ms latency).
 */
export async function fetchProvinces(): Promise<RajaOngkirProvince[]> {
  const masterProvinces = Object.keys(INDONESIA_MASTER_LOCATIONS);
  return masterProvinces.map((provName, idx) => ({
    province_id: String(idx + 1),
    province: provName
  }));
}

/**
 * Fetch cities for a province from offline master location data (0ms latency).
 */
export async function fetchCities(
  provinceId?: string,
  provinceName?: string
): Promise<RajaOngkirCity[]> {
  let targetProv = provinceName || '';
  if (!targetProv && provinceId) {
    const masterProvinces = Object.keys(INDONESIA_MASTER_LOCATIONS);
    const index = parseInt(provinceId, 10) - 1;
    if (index >= 0 && index < masterProvinces.length) {
      targetProv = masterProvinces[index];
    }
  }

  const masterCities = targetProv ? getMasterCitiesForProvince(targetProv) : [];
  if (masterCities.length > 0) {
    return masterCities.map((m) => ({
      city_id: m.city_id,
      province_id: provinceId || '1',
      province: m.province_name,
      type: m.type,
      city_name: m.city_name,
      postal_code: ''
    }));
  }

  const allCities: RajaOngkirCity[] = [];
  for (const [prov, cities] of Object.entries(INDONESIA_MASTER_LOCATIONS)) {
    cities.forEach((c) => {
      allCities.push({
        city_id: c.defaultId,
        province_id: '1',
        province: prov,
        type: c.type,
        city_name: c.name,
        postal_code: ''
      });
    });
  }
  return allCities;
}

/**
 * Fetch subdistricts for a city from offline master location data (0ms latency).
 */
export async function fetchSubdistricts(
  cityId: string,
  cityName?: string
): Promise<RajaOngkirSubdistrict[]> {
  const fallbackCityName = cityName || cityId;
  const fallbacks = getFallbackSubdistricts(fallbackCityName);
  return fallbacks.map((f) => ({
    subdistrict_id: f.subdistrict_id,
    province_id: '',
    province: f.province_name,
    city_id: cityId,
    city: f.city_name,
    type: f.type,
    subdistrict_name: f.subdistrict_name,
    district_name: f.subdistrict_name,
    postal_code: f.zip_code
  }));
}

export interface CalculateCostParams {
  origin?: string;
  originType?: 'city' | 'subdistrict';
  destination: string;
  destinationType?: 'city' | 'subdistrict';
  weight: number;
  courier: string;
}

function scaleRatesDataForWeight(
  rates: RajaOngkirCourierResult[],
  baseWeightGrams: number,
  targetWeightGrams: number
): RajaOngkirCourierResult[] {
  if (!rates || rates.length === 0) return rates;
  const factor = targetWeightGrams / Math.max(1000, baseWeightGrams || 1000);
  if (factor === 1) return rates;

  return rates.map((courierItem) => ({
    ...courierItem,
    costs: (courierItem.costs || []).map((costItem) => ({
      ...costItem,
      cost: (costItem.cost || []).map((c) => ({
        ...c,
        value: Math.round(c.value * factor)
      }))
    }))
  }));
}

/**
 * Calculate shipping cost:
 * 1. Reads DB cache first (0ms latency).
 * 2. On cache miss / expiry, fetches live official rate from RajaOngkir and auto-saves to DB cache.
 * 3. Falls back to offline calculation if API key is not configured or network fails.
 */
export async function calculateShippingCost({
  origin,
  destination,
  weight,
  courier
}: CalculateCostParams): Promise<RajaOngkirCourierResult[]> {
  if (!destination) return [];

  let originId = origin;
  if (!originId) {
    try {
      const storeSettings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
      originId = storeSettings?.originCityId || process.env.RAJAONGKIR_ORIGIN_CITY_ID || '153';
    } catch {
      originId = process.env.RAJAONGKIR_ORIGIN_CITY_ID || '153';
    }
  }

  const courierCode = courier.toLowerCase();
  const weightGrams = Math.max(1000, Math.ceil(weight / 1000) * 1000);

  // 1. Check local DB cache first (0ms latency priority)
  try {
    const cached = await prisma.shippingRateCache.findFirst({
      where: {
        originCityId: originId,
        destinationCityId: destination,
        courier: courierCode
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (cached && cached.ratesData) {
      const rawRates = cached.ratesData as unknown as RajaOngkirCourierResult[];
      if (Array.isArray(rawRates) && rawRates.length > 0 && rawRates[0].costs?.length > 0) {
        // If cache is expired, trigger background refresh non-blocking
        if (new Date(cached.expiresAt) <= new Date() && getApiKey()) {
          fetchLiveRajaOngkirRatesForSync(originId, destination, courierCode, 1000)
            .then((freshRates) => {
              if (freshRates && freshRates.length > 0 && freshRates[0].costs?.length > 0) {
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                prisma.shippingRateCache.update({
                  where: { id: cached.id },
                  data: { ratesData: freshRates as unknown as Prisma.InputJsonValue, expiresAt }
                }).catch(() => {});
              }
            })
            .catch(() => {});
        }

        return scaleRatesDataForWeight(rawRates, cached.weightGrams || 1000, weightGrams);
      }
    }
  } catch (err) {
    console.warn('DB Shipping Cache read error:', err);
  }

  // 2. Cache-Aside: Fetch live official rate on demand and save to DB
  if (getApiKey()) {
    try {
      const liveRates = await fetchLiveRajaOngkirRatesForSync(
        originId,
        destination,
        courierCode,
        1000
      );

      if (liveRates && liveRates.length > 0 && liveRates[0].costs?.length > 0) {
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days valid cache
        prisma.shippingRateCache
          .upsert({
            where: {
              originCityId_destinationCityId_courier_weightGrams: {
                originCityId: originId,
                destinationCityId: destination,
                courier: courierCode,
                weightGrams: 1000
              }
            },
            update: {
              ratesData: liveRates as unknown as Prisma.InputJsonValue,
              expiresAt
            },
            create: {
              originCityId: originId,
              destinationCityId: destination,
              courier: courierCode,
              weightGrams: 1000,
              ratesData: liveRates as unknown as Prisma.InputJsonValue,
              expiresAt
            }
          })
          .catch((saveErr) => console.warn('Failed to auto-cache live shipping rates:', saveErr));

        return scaleRatesDataForWeight(liveRates, 1000, weightGrams);
      }
    } catch (apiErr) {
      console.warn('Live RajaOngkir on-demand query failed, falling back to regional calculation:', apiErr);
    }
  }

  // 3. Offline Fallback Calculation (0ms)
  return getOfflineCalculatedRate(destination, courierCode, weightGrams);
}

/**
 * Fetch live data directly from RajaOngkir API (Reserved strictly for Sync tasks).
 */
export async function fetchLiveRajaOngkirRatesForSync(
  originId: string,
  destinationId: string,
  courierCode: string,
  weightGrams: number = 1000
): Promise<RajaOngkirCourierResult[] | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const bodyParamsV2 = new URLSearchParams();
    bodyParamsV2.append('origin', originId);
    bodyParamsV2.append('destination', destinationId);
    bodyParamsV2.append('weight', String(weightGrams));
    bodyParamsV2.append('courier', courierCode);

    const res = await fetch(`${getV2BaseUrl()}/calculate/domestic-cost`, {
      method: 'POST',
      headers: {
        key: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParamsV2.toString(),
      signal: AbortSignal.timeout(2500)
    });

    const json = await res.json();
    if (json?.meta?.code === 200 && Array.isArray(json?.data) && json.data.length > 0) {
      return [
        {
          code: courierCode.toUpperCase(),
          name: courierCode.toUpperCase(),
          costs: json.data.map(
            (srv: {
              service: string;
              name?: string;
              description?: string;
              cost: number;
              etd?: string;
            }) => ({
              service: srv.service || srv.name || 'REG',
              description: srv.description || srv.service || 'Reguler',
              cost: [
                {
                  value: srv.cost,
                  etd: srv.etd || '1-3 Hari',
                  note: ''
                }
              ]
            })
          )
        }
      ];
    }
  } catch {}

  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append('origin', originId);
    bodyParams.append('destination', destinationId);
    bodyParams.append('weight', String(weightGrams));
    bodyParams.append('courier', courierCode);

    const res2 = await fetch(`${getV1BaseUrl()}/cost`, {
      method: 'POST',
      headers: {
        key: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString(),
      signal: AbortSignal.timeout(2500)
    });

    const json2 = await res2.json();
    if (json2?.rajaongkir?.status?.code === 200 && Array.isArray(json2?.rajaongkir?.results)) {
      return json2.rajaongkir.results as RajaOngkirCourierResult[];
    }
  } catch (err) {
    console.warn('RajaOngkir live API query timeout or error, falling back:', err);
  }

  return null;
}
