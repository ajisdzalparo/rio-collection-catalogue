import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { INDONESIA_MASTER_LOCATIONS } from '@/lib/indonesia-locations';
import { parseEnabledCourierCodes } from '@/lib/couriers';

export async function POST() {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const originId = process.env.RAJAONGKIR_ORIGIN_CITY_ID || '153';
    const activeCouriers = parseEnabledCourierCodes(settings?.enabledCouriers);

    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days cache

    let seededCount = 0;

    // Default rate lookup tables for Indonesian cities based on region
    const baseRegionalRates: Record<string, number> = {
      'DKI JAKARTA': 12000,
      'JAWA BARAT': 14000,
      'BANTEN': 13000,
      'JAWA TENGAH': 16000,
      'DI YOGYAKARTA': 16000,
      'JAWA TIMUR': 18000,
      'BALI': 22000,
      'SUMATERA UTARA': 28000,
      'SUMATERA BARAT': 28000,
      'SUMATERA SELATAN': 25000,
      'RIAU': 30000,
      'KEPULAUAN RIAU': 32000,
      'JAMBI': 27000,
      'BENGKULU': 28000,
      'LAMPUNG': 22000,
      'ACEH': 35000,
      'KALIMANTAN BARAT': 35000,
      'KALIMANTAN SELATAN': 35000,
      'KALIMANTAN TIMUR': 38000,
      'KALIMANTAN TENGAH': 36000,
      'KALIMANTAN UTARA': 42000,
      'SULAWESI UTARA': 45000,
      'SULAWESI SELATAN': 38000,
      'SULAWESI TENGAH': 42000,
      'SULAWESI TENGGARA': 44000,
      'GORONTALO': 46000,
      'NUSA TENGGARA BARAT': 28000,
      'NUSA TENGGARA TIMUR': 35000,
      'MALUKU': 55000,
      'MALUKU UTARA': 58000,
      'PAPUA': 70000,
      'PAPUA BARAT': 72000
    };

    const courierServicePresets: Record<string, Array<{ service: string; desc: string; etd: string; delta: number }>> = {
      jne: [
        { service: 'JNE REG', desc: 'Layanan Reguler', etd: '2-3 Hari', delta: 0 },
        { service: 'JNE YES', desc: 'Yakin Esok Sampai', etd: '1 Hari', delta: 15000 },
        { service: 'JTR', desc: 'JNE Trucking Cargo', etd: '3-5 Hari', delta: 8000 }
      ],
      pos: [
        { service: 'POS Kilat Khusus', desc: 'Pos Kilat Khusus', etd: '2-4 Hari', delta: -2000 }
      ],
      tiki: [
        { service: 'TIKI REG', desc: 'Reguler Service', etd: '2-3 Hari', delta: 0 },
        { service: 'TIKI ONS', desc: 'Over Night Service', etd: '1 Hari', delta: 14000 }
      ],
      sicepat: [
        { service: 'SiCepat REG', desc: 'Reguler Package', etd: '2-3 Hari', delta: 0 },
        { service: 'SiCepat BEST', desc: 'Besok Sampai Tujuan', etd: '1 Hari', delta: 12000 }
      ],
      jnt: [
        { service: 'J&T EZ', desc: 'Reguler Express', etd: '2-3 Hari', delta: 2000 }
      ],
      anteraja: [
        { service: 'Anteraja Reguler', desc: 'Layanan Reguler', etd: '2-3 Hari', delta: 1000 },
        { service: 'Anteraja Next Day', desc: 'Layanan Next Day', etd: '1 Hari', delta: 13000 }
      ],
      wahana: [
        { service: 'Wahana Express', desc: 'Layanan Ekonomis', etd: '3-4 Hari', delta: -4000 }
      ],
      lion: [
        { service: 'Lion REGPACK', desc: 'Reguler Package', etd: '2-3 Hari', delta: 0 }
      ],
      ninja: [
        { service: 'Ninja Standard', desc: 'Standard Delivery', etd: '2-3 Hari', delta: 0 }
      ],
      ide: [
        { service: 'ID Express Standard', desc: 'Standard Delivery', etd: '2-3 Hari', delta: 0 }
      ]
    };

    for (const [provinceName, cities] of Object.entries(INDONESIA_MASTER_LOCATIONS)) {
      const baseFee = baseRegionalRates[provinceName] || 25000;

      for (const city of cities) {
        const destinationCityId = city.defaultId;

        for (const courierCode of activeCouriers) {
          const presets = courierServicePresets[courierCode] || [
            { service: `${courierCode.toUpperCase()} REG`, desc: 'Reguler', etd: '2-3 Hari', delta: 0 }
          ];

          const ratesData = [
            {
              code: courierCode.toUpperCase(),
              name: courierCode.toUpperCase(),
              costs: presets.map((p) => ({
                service: p.service,
                description: p.desc,
                cost: [
                  {
                    value: Math.max(10000, baseFee + p.delta),
                    etd: p.etd,
                    note: ''
                  }
                ]
              }))
            }
          ];

          await prisma.shippingRateCache.upsert({
            where: {
              originCityId_destinationCityId_courier_weightGrams: {
                originCityId: originId,
                destinationCityId,
                courier: courierCode,
                weightGrams: 1000
              }
            },
            update: {
              ratesData: ratesData as unknown as Prisma.InputJsonValue,
              expiresAt
            },
            create: {
              originCityId: originId,
              destinationCityId,
              courier: courierCode,
              weightGrams: 1000,
              ratesData: ratesData as unknown as Prisma.InputJsonValue,
              expiresAt
            }
          });
          seededCount++;
        }
      }
    }

    return NextResponse.json({
      code: 200,
      status: 'success',
      message: `Berhasil sinkronisasi & menyimpan ${seededCount} tarif ongkir ke Database PostgreSQL!`,
      data: { seededCount }
    });
  } catch (error) {
    console.error('Error syncing shipping rates to DB:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal sinkronisasi data ongkir ke database' },
      { status: 500 }
    );
  }
}
