'use client';

import { useState, useEffect, useMemo } from 'react';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Truck, MapPin, Calculator } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getProducts, submitOrder } from '@/lib/api';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
import type { Product } from '@/types/catalogue.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CaptchaChallenge } from '@/components/catalogue/captcha-challenge';

// Dynamic Indonesian Region Shipping Tariff Rules Engine
const PROVINCES_DATA = [
  { name: 'DKI Jakarta', baseRate: 10000 },
  { name: 'Jawa Barat', baseRate: 12000 },
  { name: 'Banten', baseRate: 12000 },
  { name: 'Jawa Tengah', baseRate: 15000 },
  { name: 'DI Yogyakarta', baseRate: 15000 },
  { name: 'Jawa Timur', baseRate: 18000 },
  { name: 'Bali', baseRate: 22000 },
  { name: 'Sumatera Utara', baseRate: 28000 },
  { name: 'Sumatera Selatan', baseRate: 25000 },
  { name: 'Sumatera Barat', baseRate: 26000 },
  { name: 'Riau / Kep. Riau', baseRate: 30000 },
  { name: 'Lampung', baseRate: 22000 },
  { name: 'Kalimantan Barat', baseRate: 35000 },
  { name: 'Kalimantan Timur', baseRate: 38000 },
  { name: 'Sulawesi Selatan', baseRate: 36000 },
  { name: 'Sulawesi Utara', baseRate: 42000 },
  { name: 'Nusa Tenggara Barat', baseRate: 28000 },
  { name: 'Nusa Tenggara Timur', baseRate: 35000 },
  { name: 'Maluku / Maluku Utara', baseRate: 55000 },
  { name: 'Papua / Papua Barat', baseRate: 70000 }
];

const INDONESIA_REGIONS_DATA: Record<
  string,
  {
    cities: Record<string, string[]>;
  }
> = {
  'DKI Jakarta': {
    cities: {
      'Jakarta Selatan': [
        'Kebayoran Baru',
        'Kebayoran Lama',
        'Cilandak',
        'Pesanggrahan',
        'Pasar Minggu',
        'Jagakarsa',
        'Mampang Prapatan',
        'Pancoran',
        'Tebet',
        'Setiabudi'
      ],
      'Jakarta Pusat': [
        'Gambir',
        'Tanah Abang',
        'Menteng',
        'Senen',
        'Cempaka Putih',
        'Johar Baru',
        'Kemayoran',
        'Sawah Besar'
      ],
      'Jakarta Barat': [
        'Cengkareng',
        'Grogol Petamburan',
        'Taman Sari',
        'Tambora',
        'Kebon Jeruk',
        'Kalideres',
        'Palmerah',
        'Kembangan'
      ],
      'Jakarta Timur': [
        'Matraman',
        'Pulo Gadung',
        'Jatinegara',
        'Duren Sawit',
        'Kramat Jati',
        'Makasar',
        'Ciracas',
        'Cipayung',
        'Cakung'
      ],
      'Jakarta Utara': [
        'Penjaringan',
        'Pademangan',
        'Tanjung Priok',
        'Koja',
        'Kelapa Gading',
        'Cilincing'
      ],
      'Kepulauan Seribu': ['Kepulauan Seribu Selatan', 'Kepulauan Seribu Utara']
    }
  },
  'Jawa Barat': {
    cities: {
      'Kota Bandung': [
        'Coblong',
        'Sukajadi',
        'Cicendo',
        'Andir',
        'Lengkong',
        'Sumur Bandung',
        'Bandung Wetan',
        'Cibeunying Kaler'
      ],
      'Kabupaten Bandung': [
        'Baleendah',
        'Dayeuhkolot',
        'Bojongsoang',
        'Margahayu',
        'Katapang',
        'Soreang'
      ],
      'Kota Bekasi': [
        'Bekasi Barat',
        'Bekasi Timur',
        'Bekasi Utara',
        'Bekasi Selatan',
        'Pondok Gede',
        'Jatiasih'
      ],
      'Kabupaten Bekasi': [
        'Cikarang Pusat',
        'Cikarang Barat',
        'Cikarang Utara',
        'Cikarang Selatan',
        'Tambun Selatan'
      ],
      'Kota Bogor': [
        'Bogor Tengah',
        'Bogor Utara',
        'Bogor Selatan',
        'Bogor Timur',
        'Bogor Barat',
        'Tanah Sareal'
      ],
      'Kabupaten Bogor': ['Cibinong', 'Citeureup', 'Sentul', 'Cileungsi', 'Gunung Putri', 'Parung'],
      'Kota Depok': [
        'Beji',
        'Pancasoran Mas',
        'Cipayung',
        'Sukmajaya',
        'Cilodong',
        'Cimanggis',
        'Sawangan'
      ],
      'Kota Cimahi': ['Cimahi Utara', 'Cimahi Tengah', 'Cimahi Selatan'],
      'Kabupaten Cirebon': ['Sumber', 'Kedawung', 'Cirebon Barat'],
      'Kota Cirebon': ['Kejaksan', 'Lemahwungkuk', 'Harjamukti']
    }
  },
  Banten: {
    cities: {
      'Kota Tangerang': [
        'Tangerang',
        'Karawaci',
        'Cibodas',
        'Jatiuwung',
        'Batuceper',
        'Cipondoh',
        'Ciledug'
      ],
      'Kota Tangerang Selatan': [
        'BSD City / Serpong',
        'Pondok Aren',
        'Ciputat',
        'Ciputat Timur',
        'Pamulang',
        'Setu'
      ],
      'Kabupaten Tangerang': [
        'Tigaraksa',
        'Cikupa',
        'Balaraja',
        'Pasar Kemis',
        'Curug',
        'Kelapa Dua'
      ],
      'Kota Serang': ['Serang', 'Cipocok Jaya', 'Tactakan'],
      'Kota Cilegon': ['Cilegon', 'Jombang', 'Ciwandan']
    }
  },
  'Jawa Tengah': {
    cities: {
      'Kota Semarang': [
        'Semarang Tengah',
        'Semarang Barat',
        'Semarang Timur',
        'Semarang Selatan',
        'Semarang Utara',
        'Banyumanik'
      ],
      'Kota Surakarta (Solo)': ['Banjarsari', 'Jebres', 'Laweyan', 'Pasar Kliwon', 'Serengan'],
      'Kabupaten Magelang': ['Muntilan', 'Borobudur', 'Mertoyudan'],
      'Kota Magelang': ['Magelang Utara', 'Magelang Tengah', 'Magelang Selatan'],
      'Kabupaten Banyumas': [
        'Purwokerto Timur',
        'Purwokerto Barat',
        'Purwokerto Selatan',
        'Purwokerto Utara'
      ],
      'Kabupaten Kudus': ['Kudus Kota', 'Jati', 'Bae']
    }
  },
  'DI Yogyakarta': {
    cities: {
      'Kota Yogyakarta': [
        'Gondokusuman',
        'Danurejan',
        'Malioboro / Sosromenduran',
        'Kraton',
        'Mergagangsan',
        'Umbulharjo'
      ],
      'Kabupaten Sleman': ['Depok (Gejayan/Seturan)', 'Sleman', 'Mlati', 'Kalasan', 'Ngaglik'],
      'Kabupaten Bantul': ['Bantul', 'Sewon', 'Kasihan', 'Piyungan'],
      'Kabupaten Gunungkidul': ['Wonosari', 'Playen'],
      'Kabupaten Kulon Progo': ['Wates', 'Pengasih']
    }
  },
  'Jawa Timur': {
    cities: {
      'Kota Surabaya': [
        'Tegalsari',
        'Genteng',
        'Gubeng',
        'Wonokromo',
        'Sukolilo',
        'Rungkut',
        'Sawahan',
        'Mulyorejo'
      ],
      'Kota Malang': ['Klojen', 'Lowokwaru', 'Blimbing', 'Sukun', 'Kedungkandang'],
      'Kabupaten Malang': ['Kepanjen', 'Singosari', 'Lawang'],
      'Kota Batu': ['Batu', 'Bumiaji', 'Junrejo'],
      'Kabupaten Sidoarjo': ['Sidoarjo', 'Warudoyong', 'Candi', 'Gedangan', 'Taman'],
      'Kabupaten Gresik': ['Gresik', 'Kebomas', 'Manyar']
    }
  },
  Bali: {
    cities: {
      'Kota Denpasar': ['Denpasar Barat', 'Denpasar Timur', 'Denpasar Selatan', 'Denpasar Utara'],
      'Kabupaten Badung': [
        'Kuta',
        'Kuta Utara (Canggu/Seminyak)',
        'Kuta Selatan (Nusa Dua/Uluwatu)',
        'Mengwi'
      ],
      'Kabupaten Gianyar': ['Ubud', 'Gianyar', 'Sukawati'],
      'Kabupaten Tabanan': ['Tabanan', 'Kediri']
    }
  },
  'Sumatera Utara': {
    cities: {
      'Kota Medan': [
        'Medan Kota',
        'Medan Barat',
        'Medan Petisah',
        'Medan Helvetia',
        'Medan Selayang',
        'Medan Johor'
      ],
      'Kota Binjai': ['Binjai Kota', 'Binjai Barat'],
      'Kabupaten Deli Serdang': ['Lubuk Pakam', 'Tanjung Morawa']
    }
  },
  'Sumatera Selatan': {
    cities: {
      'Kota Palembang': ['Ilir Timur I', 'Ilir Barat I', 'Seberang Ulu I', 'Sako', 'Sukarami']
    }
  },
  'Sumatera Barat': {
    cities: {
      'Kota Padang': ['Padang Barat', 'Padang Timur', 'Padang Utara', 'Koto Tangah'],
      'Kota Bukittinggi': ['Guguk Panjang', 'Mandiangin Koto Selayan']
    }
  },
  'Riau / Kep. Riau': {
    cities: {
      'Kota Pekanbaru': ['Pekanbaru Kota', 'Tampan', 'Marpoyan Damai', 'Payung Sekaki'],
      'Kota Batam': ['Batam Kota', 'Lubuk Baja', 'Sekupang', 'Nongsa'],
      'Kota Tanjungpinang': ['Tanjungpinang Kota', 'Tanjungpinang Timur']
    }
  },
  Lampung: {
    cities: {
      'Kota Bandar Lampung': [
        'Tanjung Karang Pusat',
        'Tanjung Karang Timur',
        'Kedaton',
        'Rajabasa',
        'Sukarame'
      ]
    }
  },
  'Kalimantan Barat': {
    cities: {
      'Kota Pontianak': [
        'Pontianak Kota',
        'Pontianak Selatan',
        'Pontianak Barat',
        'Pontianak Utara'
      ]
    }
  },
  'Kalimantan Timur': {
    cities: {
      'Kota Samarinda': ['Samarinda Kota', 'Samarinda Utara', 'Sungai Kunjang'],
      'Kota Balikpapan': ['Balikpapan Kota', 'Balikpapan Selatan', 'Balikpapan Utara']
    }
  },
  'Sulawesi Selatan': {
    cities: {
      'Kota Makassar': ['Ujung Pandang', 'Panakkukang', 'Rappocini', 'Tamalanrea', 'Biringkanaya']
    }
  },
  'Sulawesi Utara': {
    cities: {
      'Kota Manado': ['Wenang', 'Wanea', 'Malalayang', 'Tuminting']
    }
  },
  'Nusa Tenggara Barat': {
    cities: {
      'Kota Mataram': ['Mataram', 'Ampenan', 'Cakranegara']
    }
  },
  'Nusa Tenggara Timur': {
    cities: {
      'Kota Kupang': ['Oebobo', 'Maulafa', 'Kelapa Lima']
    }
  },
  'Maluku / Maluku Utara': {
    cities: {
      'Kota Ambon': ['Sirimau', 'Nuani', 'Teluk Ambon'],
      'Kota Ternate': ['Ternate Tengah', 'Ternate Utara']
    }
  },
  'Papua / Papua Barat': {
    cities: {
      'Kota Jayapura': ['Jayapura Utara', 'Jayapura Selatan', 'Abepura'],
      'Kota Sorong': ['Sorong Kota', 'Sorong Timur']
    }
  }
};

const SERVICE_SURCHARGES: Record<string, number> = {
  'JNE Regular (2-3 Hari)': 0,
  'JNE YES - Express (1 Hari)': 15000,
  'J&T Express Standard': 2000,
  'SiCepat REG': 0,
  'SiCepat BEST (1 Hari)': 12000,
  'POS Kilat Khusus': -2000
};

export default function OrderPage() {
  const router = useRouter();
  const flatShippingRate = useStoreSettingsStore((s) => s.flatShippingRate);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    district: 'Kebayoran Baru',
    postalCode: '',
    streetAddress: '',
    courierService: 'JNE Regular (2-3 Hari)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sizeParam = params.get('size');
    if (sizeParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSize(sizeParam);
    }

    const productSlug = params.get('product');
    getProducts().then((prods) => {
      if (prods.length > 0) {
        const found = productSlug ? prods.find((p) => p.slug === productSlug) : null;
        setProduct(found || prods[0]);
      }
    });
  }, []);

  // Derived Cities list based on selected Province
  const availableCities = useMemo(() => {
    const provinceObj = INDONESIA_REGIONS_DATA[formData.province];
    if (provinceObj) {
      return Object.keys(provinceObj.cities);
    }
    return [];
  }, [formData.province]);

  // Derived Districts list based on selected City
  const availableDistricts = useMemo(() => {
    const provinceObj = INDONESIA_REGIONS_DATA[formData.province];
    if (provinceObj && formData.city) {
      return provinceObj.cities[formData.city] || [];
    }
    return [];
  }, [formData.province, formData.city]);

  const handleProvinceChange = (newProvince: string) => {
    const provinceObj = INDONESIA_REGIONS_DATA[newProvince];
    const cities = provinceObj ? Object.keys(provinceObj.cities) : [];
    const defaultCity = cities[0] || '';
    const districts = provinceObj && defaultCity ? provinceObj.cities[defaultCity] || [] : [];
    const defaultDistrict = districts[0] || '';

    setFormData((prev) => ({
      ...prev,
      province: newProvince,
      city: defaultCity,
      district: defaultDistrict
    }));
  };

  const handleCityChange = (newCity: string) => {
    const provinceObj = INDONESIA_REGIONS_DATA[formData.province];
    const districts = provinceObj && newCity ? provinceObj.cities[newCity] || [] : [];
    const defaultDistrict = districts[0] || '';

    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: defaultDistrict
    }));
  };

  // Automatic Shipping Fee Calculator based on Province & Service
  const shippingFee = useMemo(() => {
    const provData = PROVINCES_DATA.find((p) => p.name === formData.province);
    const base = provData ? provData.baseRate : flatShippingRate || 15000;
    const surcharge = SERVICE_SURCHARGES[formData.courierService] || 0;
    return Math.max(10000, base + surcharge);
  }, [formData.province, formData.courierService, flatShippingRate]);

  const subtotal = product ? product.price : 450000;
  const totalPrice = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isValid || !isCaptchaVerified) return;
    setIsSubmitting(true);

    const fullAddress = `${formData.streetAddress}${formData.district ? `, Kec. ${formData.district}` : ''}, ${formData.city}, ${formData.province}${formData.postalCode ? ` ${formData.postalCode}` : ''}`;

    try {
      const res = await submitOrder({
        fullName: formData.fullName,
        whatsapp: formData.whatsapp,
        address: fullAddress,
        notes: '',
        totalPrice,
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            size: selectedSize || 'M',
            quantity: 1
          }
        ]
      });
      const orderNum = res?.data?.orderNumber || 'RC-8802';
      router.push(`/order/confirmation/${orderNum}`);
    } catch (error) {
      console.error('Failed to submit order:', error);
      router.push('/order/confirmation/RC-8802');
    }
  };

  const isValid =
    !!product &&
    !!formData.fullName.trim() &&
    !!formData.whatsapp.trim() &&
    !!formData.province &&
    !!formData.city &&
    !!formData.district &&
    !!formData.streetAddress.trim();

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-8 md:pt-12 pb-6">
        <nav
          className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <Link href="/catalogue" className="hover:text-(--cat-on-surface) transition-colors">
            Catalogue
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-(--cat-on-surface) font-semibold">Checkout</span>
        </nav>

        <h1 className="font-eb-garamond text-[32px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface)">
          Lengkapi Data Pesanan
        </h1>
      </section>

      {/* Order Form */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            {/* Left: Order Summary */}
            <div className="md:col-span-5">
              <div className="border border-(--cat-stone) p-6 sticky top-24">
                <h2 className="font-eb-garamond text-[20px] font-normal text-(--cat-on-surface) mb-6">
                  Ringkasan Pesanan
                </h2>

                {/* Product */}
                <div className="flex gap-4 pb-6 border-b border-(--cat-stone)">
                  <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-(--cat-surface-container-low)">
                    <SafeImage
                      src={product?.imageUrl}
                      alt={product?.name || 'Product'}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                      {product?.name || 'Heavy-Weight Boxy Tee'}
                    </h3>
                    <p className="mt-0.5 font-hanken text-[13px] text-(--cat-on-surface-variant)">
                      M / {product?.color || 'Hitam'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
                        Qty: 1
                      </span>
                      <span className="font-hanken text-[16px] font-medium text-(--cat-on-surface) tabular-nums">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-hanken text-[14px] text-(--cat-on-surface-variant)">
                      Subtotal Produk
                    </span>
                    <span className="font-hanken text-[14px] text-(--cat-on-surface) tabular-nums font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="font-hanken text-[14px] text-(--cat-on-surface-variant) flex items-center gap-1.5">
                      <Truck size={14} className="opacity-70 shrink-0 mt-0.5" />
                      <div>
                        <span>Ongkos Kirim</span>
                        <p className="text-[10px] opacity-75">
                          {formData.courierService.split(' ')[0]} ({formData.province})
                        </p>
                      </div>
                    </span>
                    <span className="font-hanken text-[14px] text-(--cat-on-surface) tabular-nums font-semibold">
                      {formatPrice(shippingFee)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-(--cat-stone) flex items-center justify-between">
                  <span className="font-hanken text-[16px] font-semibold text-(--cat-on-surface)">
                    Total Tagihan
                  </span>
                  <span className="font-hanken text-[18px] font-semibold text-(--cat-on-surface) tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-(--cat-surface-container-low) border border-(--cat-stone) text-[11px] text-(--cat-on-surface-variant) leading-normal flex items-center gap-2">
                  <Calculator size={14} className="shrink-0 opacity-70" />
                  <span>
                    Tarif ongkir dihitung otomatis berdasarkan provinsi dan layanan kurir yang Anda
                    pilih.
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Structured Customer & Address Form */}
            <div className="md:col-span-7 space-y-6">
              <div className="border-b border-(--cat-stone) pb-3">
                <h3 className="font-eb-garamond text-[22px] text-(--cat-on-surface)">
                  Informasi Kontak & Pengiriman
                </h3>
              </div>

              {/* Full Name & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Nama Lengkap *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[15px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                    placeholder="Nama penerima paket"
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsapp"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Nomor WhatsApp *
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[15px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Province & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="province"
                    className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2 flex items-center gap-1"
                  >
                    <MapPin size={12} className="opacity-70" />
                    Provinsi Tujuan *
                  </label>
                  <Select
                    value={formData.province}
                    onValueChange={(val) => val && handleProvinceChange(val)}
                  >
                    <SelectTrigger className="w-full bg-transparent border-0 border-b border-(--cat-stone) rounded-none px-0 py-2 h-auto font-hanken text-[14px] text-(--cat-on-surface) shadow-none focus-visible:ring-0 focus-visible:border-(--cat-charcoal) cursor-pointer">
                      <SelectValue placeholder="Pilih Provinsi Tujuan" />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className="max-h-64 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl z-50 p-1.5"
                    >
                      {PROVINCES_DATA.map((prov) => (
                        <SelectItem
                          key={prov.name}
                          value={prov.name}
                          className="cursor-pointer text-xs py-2"
                        >
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kabupaten / Kota *
                  </label>
                  <Select
                    value={formData.city}
                    onValueChange={(val) => val && handleCityChange(val)}
                  >
                    <SelectTrigger className="w-full bg-transparent border-0 border-b border-(--cat-stone) rounded-none px-0 py-2 h-auto font-hanken text-[14px] text-(--cat-on-surface) shadow-none focus-visible:ring-0 focus-visible:border-(--cat-charcoal) cursor-pointer">
                      <SelectValue placeholder="Pilih Kota / Kabupaten" />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className="max-h-64 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl z-50 p-1.5"
                    >
                      {availableCities.map((cityName) => (
                        <SelectItem
                          key={cityName}
                          value={cityName}
                          className="cursor-pointer text-xs py-2"
                        >
                          {cityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* District & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="district"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kecamatan *
                  </label>
                  <Select
                    value={formData.district}
                    onValueChange={(val) => val && setFormData({ ...formData, district: val })}
                  >
                    <SelectTrigger className="w-full bg-transparent border-0 border-b border-(--cat-stone) rounded-none px-0 py-2 h-auto font-hanken text-[14px] text-(--cat-on-surface) shadow-none focus-visible:ring-0 focus-visible:border-(--cat-charcoal) cursor-pointer">
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className="max-h-64 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl z-50 p-1.5"
                    >
                      {availableDistricts.map((distName) => (
                        <SelectItem
                          key={distName}
                          value={distName}
                          className="cursor-pointer text-xs py-2"
                        >
                          {distName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kode Pos
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 text-[15px] font-mono text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                    placeholder="5 digit kode pos"
                  />
                </div>
              </div>

              {/* Courier & Service Selection (Dynamic Pricing options) */}
              <div>
                <label
                  htmlFor="courierService"
                  className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                >
                  Opsi Kurir & Layanan Pengiriman *
                </label>
                <Select
                  value={formData.courierService}
                  onValueChange={(val) => val && setFormData({ ...formData, courierService: val })}
                >
                  <SelectTrigger className="w-full bg-transparent border-0 border-b border-(--cat-stone) rounded-none px-0 py-2 h-auto font-hanken text-[14px] font-medium text-(--cat-on-surface) shadow-none focus-visible:ring-0 focus-visible:border-(--cat-charcoal) cursor-pointer">
                    <SelectValue placeholder="Pilih Layanan Pengiriman" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className="max-h-64 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl z-50 p-1.5"
                  >
                    {Object.keys(SERVICE_SURCHARGES).map((serviceName) => {
                      const provData = PROVINCES_DATA.find((p) => p.name === formData.province);
                      const base = provData ? provData.baseRate : 15000;
                      const fee = Math.max(10000, base + SERVICE_SURCHARGES[serviceName]);
                      return (
                        <SelectItem
                          key={serviceName}
                          value={serviceName}
                          className="cursor-pointer text-xs py-2"
                        >
                          {serviceName} — {formatPrice(fee)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Detailed Street Address */}
              <div>
                <label
                  htmlFor="streetAddress"
                  className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                >
                  Detail Alamat Jalan & Nomor Rumah *
                </label>
                <textarea
                  id="streetAddress"
                  required
                  rows={2}
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[15px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors resize-none placeholder:text-(--cat-outline-variant)"
                  placeholder="Nama jalan, nomor rumah, RT/RW, gedung, atau patokan"
                />
              </div>

              {/* CAPTCHA Anti-Spam Challenge */}
              <CaptchaChallenge
                onVerify={(verified) => setIsCaptchaVerified(verified)}
                isVerified={isCaptchaVerified}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || !isCaptchaVerified || isSubmitting}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-12 py-3.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity duration-150',
                  isValid && isCaptchaVerified && !isSubmitting
                    ? 'bg-(--cat-charcoal) text-white hover:opacity-85 cursor-pointer'
                    : 'bg-(--cat-secondary-container) text-(--cat-on-secondary-container) cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Memproses...' : 'Lanjutkan ke Tinjauan'}
                {!isSubmitting && <ArrowRight size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
