'use client';

import { useState, useEffect, useMemo } from 'react';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Truck, MapPin, Calculator, Loader2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getProducts, submitOrder } from '@/lib/api';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
import type { Product } from '@/types/catalogue.types';
import { CaptchaChallenge } from '@/components/catalogue/captcha-challenge';
import { SearchableSelect } from '@/components/catalogue/searchable-select';
import { isOrderableStatus } from '@/lib/product-availability';
import { withActionLoading } from '@/hooks/use-action-loading';

interface ShippingOption {
  key: string;
  label: string;
  cost: number;
  courier: string;
  etd: string;
  courierCode: string;
  service: string;
  destination: string;
}

export default function OrderPage() {
  const router = useRouter();
  const enabledCouriersSetting = useStoreSettingsStore((s) => s.enabledCouriers);

  const activeCourierCodes = useMemo(() => {
    const raw = enabledCouriersSetting ?? 'jne,pos,tiki,sicepat,jnt';
    return raw
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }, [enabledCouriersSetting]);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    province: '',
    city: '',
    district: '',
    postalCode: '',
    streetAddress: '',
    courierService: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(process.env.NODE_ENV !== 'production');
  const [captchaToken, setCaptchaToken] = useState(
    process.env.NODE_ENV !== 'production' ? 'dev-testing-token' : ''
  );
  const [captchaReset, setCaptchaReset] = useState(0);
  const [submitError, setSubmitError] = useState('');

  // Dynamic Shipping Locations & Rates
  const [provinces, setProvinces] = useState<Array<{ province_id: string; province: string }>>([]);
  const [cities, setCities] = useState<
    Array<{ city_id: string; province_id: string; city_name: string; type: string }>
  >([]);
  const [subdistricts, setSubdistricts] = useState<
    Array<{ subdistrict_id: string; subdistrict_name: string; postal_code?: string }>
  >([]);
  const [rajaRates, setRajaRates] = useState<ShippingOption[]>([]);
  const [isShippingLoading, setIsShippingLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sizeParam = params.get('size');
    const colorParam = params.get('color');
    const quantityParam = params.get('quantity');

    queueMicrotask(() => {
      if (sizeParam) {
        setSelectedSize(sizeParam);
      }
      if (colorParam) {
        setSelectedColor(colorParam);
      }
      if (quantityParam) {
        const parsedQty = parseInt(quantityParam, 10);
        if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty <= 99) {
          setQuantity(parsedQty);
        }
      }
    });

    const productSlug = params.get('product');
    getProducts().then((prods) => {
      if (prods.length > 0) {
        const found = productSlug ? prods.find((p) => p.slug === productSlug) : null;
        setProduct(
          productSlug ? found || null : prods.find((p) => isOrderableStatus(p.status)) || null
        );
      }
    });

    // Fetch dynamic provinces
    fetch('/api/v1/shipping/provinces')
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
          setProvinces(res.data);
          const defaultProv = res.data[0];
          setFormData((prev) => ({ ...prev, province: defaultProv.province }));

          // Fetch cities for initial province
          fetch(
            `/api/v1/shipping/cities?provinceId=${defaultProv.province_id}&provinceName=${encodeURIComponent(defaultProv.province)}`
          )
            .then((cRes) => cRes.json())
            .then((cRes) => {
              if (cRes.code === 200 && Array.isArray(cRes.data) && cRes.data.length > 0) {
                setCities(cRes.data);
                const defaultCity = `${cRes.data[0].type} ${cRes.data[0].city_name}`;
                setFormData((prev) => ({ ...prev, city: defaultCity }));

                // Fetch subdistricts for initial city
                fetch(
                  `/api/v1/shipping/subdistricts?cityId=${cRes.data[0].city_id}&cityName=${encodeURIComponent(cRes.data[0].city_name)}`
                )
                  .then((sRes) => sRes.json())
                  .then((sRes) => {
                    if (sRes.code === 200 && Array.isArray(sRes.data) && sRes.data.length > 0) {
                      setSubdistricts(sRes.data);
                      setFormData((prev) => ({
                        ...prev,
                        district: sRes.data[0].subdistrict_name,
                        postalCode: sRes.data[0].postal_code || prev.postalCode
                      }));
                    }
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load provinces:', err);
      });
  }, []);

  const availableCities = useMemo(() => {
    return cities.map((c) => {
      if (c.city_name.toLowerCase().startsWith(c.type.toLowerCase())) {
        return c.city_name;
      }
      return `${c.type} ${c.city_name}`;
    });
  }, [cities]);

  const availableDistricts = useMemo(() => {
    return subdistricts.map((s) => s.subdistrict_name);
  }, [subdistricts]);

  const availablePostalCodes = useMemo(() => {
    const set = new Set<string>();
    subdistricts.forEach((s) => {
      if (s.postal_code && s.postal_code.trim()) {
        set.add(s.postal_code.trim());
      }
    });
    return Array.from(set);
  }, [subdistricts]);

  const handleProvinceChange = (newProvince: string) => {
    const matchedProv = provinces.find(
      (p) => p.province.toLowerCase() === newProvince.toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      province: newProvince,
      city: '',
      district: '',
      postalCode: '',
      courierService: ''
    }));

    if (matchedProv) {
      setIsShippingLoading(true);
      fetch(
        `/api/v1/shipping/cities?provinceId=${matchedProv.province_id}&provinceName=${encodeURIComponent(matchedProv.province)}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
            setCities(res.data);
            const defaultCity = `${res.data[0].type} ${res.data[0].city_name}`;
            setFormData((prev) => ({ ...prev, city: defaultCity }));

            // Fetch subdistricts for new first city
            fetch(
              `/api/v1/shipping/subdistricts?cityId=${res.data[0].city_id}&cityName=${encodeURIComponent(res.data[0].city_name)}`
            )
              .then((sRes) => sRes.json())
              .then((sRes) => {
                if (sRes.code === 200 && Array.isArray(sRes.data) && sRes.data.length > 0) {
                  setSubdistricts(sRes.data);
                  setFormData((prev) => ({
                    ...prev,
                    district: sRes.data[0].subdistrict_name,
                    postalCode: sRes.data[0].postal_code || prev.postalCode
                  }));
                }
              })
              .catch(() => {});
          } else {
            setCities([]);
            setSubdistricts([]);
          }
        })
        .catch(() => {
          setCities([]);
          setSubdistricts([]);
        })
        .finally(() => setIsShippingLoading(false));
    }
  };

  const handleCityChange = (newCity: string) => {
    const matchedCity = cities.find(
      (c) =>
        `${c.type} ${c.city_name}`.toLowerCase() === newCity.toLowerCase() ||
        c.city_name.toLowerCase() === newCity.toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: '',
      postalCode: '',
      courierService: ''
    }));

    if (matchedCity) {
      fetch(
        `/api/v1/shipping/subdistricts?cityId=${matchedCity.city_id}&cityName=${encodeURIComponent(matchedCity.city_name)}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
            setSubdistricts(res.data);
            const defaultSub = res.data[0];
            setFormData((prev) => ({
              ...prev,
              district: defaultSub.subdistrict_name,
              postalCode: defaultSub.postal_code || prev.postalCode
            }));
          } else {
            setSubdistricts([]);
          }
        })
        .catch(() => setSubdistricts([]));
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    const matchedSub = subdistricts.find((s) => s.subdistrict_name === newDistrict);
    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      postalCode: matchedSub?.postal_code || prev.postalCode
    }));
  };

  useEffect(() => {
    if (!formData.city || cities.length === 0) return;

    const matchedCity = cities.find(
      (c) =>
        `${c.type} ${c.city_name}`.toLowerCase() === formData.city.toLowerCase() ||
        c.city_name.toLowerCase() === formData.city.toLowerCase()
    );

    if (!matchedCity) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsShippingLoading(true);
        setRajaRates([]);
      }
    });

    const weightInGrams = Math.max(1000, quantity * 350);

    const activeCouriers = activeCourierCodes;

    Promise.all(
      activeCouriers.map((courier) =>
        fetch('/api/v1/shipping/cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: matchedCity.city_id,
            destinationType: 'city',
            weight: weightInGrams,
            courier
          })
        }).then((res) => res.json())
      )
    )
      .then((results) => {
        if (!isMounted) return;
        const options: ShippingOption[] = [];

        results.forEach((res) => {
          if (res.code === 200 && Array.isArray(res.data)) {
            res.data.forEach(
              (courierItem: {
                code: string;
                name: string;
                costs: Array<{
                  service: string;
                  description: string;
                  cost: Array<{ value: number; etd: string }>;
                }>;
              }) => {
                courierItem.costs.forEach((costItem) => {
                  const price = costItem.cost[0]?.value || 0;
                  const rawEtd = costItem.cost[0]?.etd || '';
                  const etdText = rawEtd ? ` (${rawEtd.replace(/hari/i, '').trim()} Hari)` : '';
                  const keyName = `${courierItem.code.toUpperCase()} ${costItem.service}`;
                  const labelText = `${courierItem.code.toUpperCase()} ${costItem.service}${etdText} — ${formatPrice(price)}`;

                  options.push({
                    key: keyName,
                    label: labelText,
                    cost: price,
                    courier: courierItem.name,
                    etd: rawEtd,
                    courierCode: courierItem.code.toLowerCase(),
                    service: costItem.service,
                    destination: matchedCity.city_id
                  });
                });
              }
            );
          }
        });

        if (options.length > 0) {
          setRajaRates(options);
          setFormData((prev) => ({ ...prev, courierService: options[0].key }));
        } else {
          setRajaRates([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch RajaOngkir rates:', err);
      })
      .finally(() => {
        if (isMounted) setIsShippingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.city, quantity, cities, activeCourierCodes]);

  // Only use a tariff returned by the server; the same service is checked at submission.
  const shippingFee = useMemo(() => {
    return rajaRates.find((rate) => rate.key === formData.courierService)?.cost ?? 0;
  }, [formData.courierService, rajaRates]);

  const subtotal = (product ? product.price : 450000) * quantity;
  const totalPrice = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isValid || !isCaptchaVerified || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    const cleanDistrict = formData.district
      ? formData.district.trim().toLowerCase().startsWith('kec.')
        ? formData.district.trim()
        : `Kec. ${formData.district.trim()}`
      : '';

    const fullAddress = [
      formData.streetAddress.trim(),
      cleanDistrict,
      formData.city.trim(),
      formData.province.trim(),
      formData.postalCode.trim()
    ]
      .filter(Boolean)
      .join(', ');

    try {
      const res = await withActionLoading(
        () =>
          submitOrder({
            fullName: formData.fullName,
            whatsapp: formData.whatsapp,
            address: fullAddress,
            notes: '',
            totalPrice,
            shippingFee,
            captchaToken,
            shipping: {
              destination: selectedRate!.destination,
              courier: selectedRate!.courierCode,
              service: selectedRate!.service
            },
            items: [
              {
                productId: product.id,
                color: selectedColor || product.color,
                size: selectedSize || 'M',
                quantity
              }
            ]
          }),
        'Mengirim pesanan Anda...'
      );
      const orderNum = res.data.orderNumber;
      router.push(`/order/confirmation/${orderNum}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Pesanan gagal dikirim. Silakan coba lagi.'
      );
      if (process.env.NODE_ENV === 'production') {
        setIsCaptchaVerified(false);
        setCaptchaToken('');
        setCaptchaReset((value) => value + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRate = rajaRates.find((rate) => rate.key === formData.courierService);
  const selectedVariant = product?.variants.find((variant) => variant.size === selectedSize);
  const isValid =
    !!product &&
    isOrderableStatus(product.status) &&
    !!selectedVariant?.inStock &&
    (product.stockMode === 'ALWAYS_AVAILABLE' || (selectedVariant.stock ?? 0) >= quantity) &&
    !!selectedRate &&
    !isShippingLoading &&
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
                      {selectedSize || 'M'} /{' '}
                      <span className="capitalize">
                        {selectedColor || product?.color || 'Hitam'}
                      </span>
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
                        Qty: {quantity}
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
                      {isShippingLoading ? (
                        <Loader2 size={14} className="animate-spin text-amber-600 inline" />
                      ) : (
                        formatPrice(shippingFee)
                      )}
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
                  <SearchableSelect
                    value={formData.province}
                    onValueChange={(val) => handleProvinceChange(val)}
                    options={provinces.map((p) => p.province)}
                    placeholder="Pilih Provinsi Tujuan"
                    searchPlaceholder="Cari provinsi..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kabupaten / Kota *
                  </label>
                  <SearchableSelect
                    value={formData.city}
                    onValueChange={(val) => handleCityChange(val)}
                    options={availableCities}
                    placeholder="Pilih Kota / Kabupaten"
                    searchPlaceholder="Cari kota / kabupaten..."
                    isLoading={isShippingLoading && cities.length === 0}
                  />
                </div>
              </div>

              {/* District & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="district"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kecamatan & Desa / Kelurahan *
                  </label>
                  <SearchableSelect
                    value={formData.district}
                    onValueChange={(val) => handleDistrictChange(val)}
                    options={availableDistricts}
                    placeholder="Pilih Kecamatan / Desa"
                    searchPlaceholder="Cari kecamatan / desa..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2"
                  >
                    Kode Pos{' '}
                    {availablePostalCodes.length > 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase tracking-normal">
                        (otomatis terisi)
                      </span>
                    )}
                  </label>
                  {availablePostalCodes.length > 0 ? (
                    <SearchableSelect
                      value={formData.postalCode}
                      onValueChange={(val) => setFormData({ ...formData, postalCode: val })}
                      options={availablePostalCodes}
                      placeholder="Pilih Kode Pos"
                      searchPlaceholder="Cari kode pos..."
                    />
                  ) : (
                    <input
                      id="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 text-[15px] font-mono text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                      placeholder="5 digit kode pos"
                    />
                  )}
                </div>
              </div>

              {/* Courier & Service Selection (Dynamic Pricing options) */}
              <div>
                <label
                  htmlFor="courierService"
                  className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-2 flex items-center justify-between"
                >
                  <span>Opsi Kurir & Layanan Pengiriman *</span>
                  {isShippingLoading && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal lowercase tracking-normal">
                      <Loader2 size={12} className="animate-spin" /> Menghitung ongkir...
                    </span>
                  )}
                </label>
                <SearchableSelect
                  value={formData.courierService}
                  onValueChange={(val) => setFormData({ ...formData, courierService: val })}
                  options={rajaRates
                    .filter((rate) => activeCourierCodes.includes(rate.courierCode))
                    .map((rate) => ({ label: rate.label, value: rate.key }))}
                  placeholder={
                    isShippingLoading ? 'Memuat tarif ongkir...' : 'Pilih Layanan Pengiriman'
                  }
                  searchPlaceholder="Cari kurir / layanan..."
                  isLoading={isShippingLoading}
                />
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
                  rows={3}
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full bg-transparent border border-(--cat-stone) p-3 font-hanken text-[14px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant) resize-none"
                  placeholder="Nama jalan, nomor rumah, RT/RW, gedung, atau patokan lokasi"
                />
              </div>

              {/* CAPTCHA Challenge */}
              <div className="pt-4 border-t border-(--cat-stone)">
                <CaptchaChallenge
                  key={captchaReset}
                  onVerify={(verified, token) => {
                    setIsCaptchaVerified(verified);
                    setCaptchaToken(token || '');
                  }}
                  isVerified={isCaptchaVerified}
                />
              </div>

              {/* Submit Button */}
              {submitError && (
                <p role="alert" className="text-sm text-red-700">
                  {submitError}
                </p>
              )}
              {!isShippingLoading && !selectedRate && (
                <p role="status" className="text-sm">
                  Tarif pengiriman belum tersedia. Pilih ulang kota atau muat ulang halaman.
                </p>
              )}
              {product && (!isOrderableStatus(product.status) || !selectedVariant?.inStock) && (
                <p role="alert" className="text-sm">
                  Produk atau ukuran tidak tersedia.{' '}
                  <Link href={`/products/${product.slug}`} className="underline">
                    Pilih ulang produk
                  </Link>
                  .
                </p>
              )}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!isValid || !isCaptchaVerified || isSubmitting}
                  className={cn(
                    'w-full py-4 px-8 font-hanken text-[12px] font-semibold uppercase tracking-[0.12em] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer',
                    isValid && isCaptchaVerified && !isSubmitting
                      ? 'bg-(--cat-charcoal) text-white hover:opacity-90'
                      : 'bg-(--cat-secondary-container) text-(--cat-on-secondary-container) opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <span>Memproses Pesanan...</span>
                  ) : (
                    <>
                      <span>Konfirmasi & Buat Pesanan</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="mt-3 text-center font-hanken text-[11px] text-(--cat-on-surface-variant)">
                  Setelah membuat pesanan, tim kami akan menghubungi Anda melalui WhatsApp untuk
                  konfirmasi & instruksi pembayaran.
                </p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
