'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import axios from 'axios';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Truck, Loader2, Mail, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { submitOrder } from '@/lib/api';
import { useProducts } from '@/hooks/use-products';
import { useSendOrderOtp, useVerifyOrderOtp } from '@/hooks/use-customer-account';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
import { useCustomerStore } from '@/lib/customer-store';
import { useCartStore } from '@/lib/cart-store';
import { SearchableSelect } from '@/components/catalogue/searchable-select';
import { isOrderableStatus } from '@/lib/product-availability';
import { withActionLoading } from '@/hooks/use-action-loading';
import { toast } from 'sonner';

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

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCartMode = searchParams.get('mode') === 'cart';
  const sizeParam = searchParams.get('size');
  const colorParam = searchParams.get('color');
  const quantityParam = searchParams.get('quantity');
  const productSlug = searchParams.get('product');

  const enabledCouriersSetting = useStoreSettingsStore((s) => s.enabledCouriers);
  const { customer, token: customerToken, isAuthenticated } = useCustomerStore();
  const { items: cartItems, clearCart } = useCartStore();

  const { data: allProducts = [] } = useProducts();
  const product = useMemo(() => {
    if (isCartMode || allProducts.length === 0) return null;
    if (productSlug) {
      return allProducts.find((p) => p.slug === productSlug) || null;
    }
    return allProducts.find((p) => isOrderableStatus(p.status)) || null;
  }, [isCartMode, allProducts, productSlug]);
  const selectedSize = sizeParam || 'M';
  const selectedColor = colorParam || '';
  const quantity = useMemo(() => {
    if (quantityParam) {
      const parsedQty = parseInt(quantityParam, 10);
      if (!isNaN(parsedQty) && parsedQty > 0) return parsedQty;
    }
    return 1;
  }, [quantityParam]);

  const [formData, setFormData] = useState(() => ({
    fullName: customer?.fullName || '',
    email: customer?.email || '',
    whatsapp: customer?.whatsapp || '',
    province: customer?.provinceName || '',
    city: customer?.cityName || '',
    district: customer?.district || '',
    postalCode: customer?.postalCode || '',
    streetAddress: customer?.address || '',
    courierService: '',
    notes: ''
  }));

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const sendOrderOtpMutation = useSendOrderOtp();
  const verifyOrderOtpMutation = useVerifyOrderOtp();
  const isSendingOtp = sendOrderOtpMutation.isPending;
  const isVerifyingOtp = verifyOrderOtpMutation.isPending;
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Active Couriers
  const activeCourierCodes = useMemo(() => {
    const raw = enabledCouriersSetting ?? 'jne,pos,tiki,sicepat,jnt';
    return raw
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }, [enabledCouriersSetting]);

  const prefilledCustIdRef = useRef<string | null>(null);
  const isDefaultInitializedRef = useRef(false);

  // Dynamic provinces & customer profile address prefill
  useEffect(() => {
    const normalizeCity = (name: string) =>
      name
        .toLowerCase()
        .replace(/^(kota|kabupaten|kab\.)\s+/i, '')
        .trim();
    const normalizeDistrict = (name: string) =>
      name
        .toLowerCase()
        .replace(/^(kec\.|kecamatan)\s+/i, '')
        .trim();

    const loadLocationsAndPrefill = async () => {
      try {
        const { data: provRes } = await axios.get('/api/v1/shipping/provinces');
        if (provRes.code !== 200 || !Array.isArray(provRes.data) || provRes.data.length === 0)
          return;

        const provs = provRes.data;
        setProvinces(provs);

        const targetProvName = customer?.provinceName?.trim();
        const targetCityName = customer?.cityName?.trim();
        const targetCityId = customer?.cityId?.trim();
        const targetDistrict = customer?.district?.trim();
        const targetPostalCode = customer?.postalCode?.trim();

        // Match province
        const matchedProv = targetProvName
          ? provs.find(
              (p: { province: string }) =>
                p.province.toLowerCase() === targetProvName.toLowerCase() ||
                p.province.toLowerCase().includes(targetProvName.toLowerCase()) ||
                targetProvName.toLowerCase().includes(p.province.toLowerCase())
            ) || provs[0]
          : provs[0];

        // Fetch cities
        const { data: cityRes } = await axios.get(
          `/api/v1/shipping/cities?provinceId=${matchedProv.province_id}&provinceName=${encodeURIComponent(matchedProv.province)}`
        );

        let matchedCityFormatted = '';
        let matchedCityId = '';
        let matchedCityName = '';
        let citiesList: Array<{
          city_id: string;
          province_id: string;
          city_name: string;
          type: string;
        }> = [];

        if (cityRes.code === 200 && Array.isArray(cityRes.data) && cityRes.data.length > 0) {
          citiesList = cityRes.data;
          setCities(citiesList);

          const matchedCity =
            targetCityName || targetCityId
              ? citiesList.find((c) => {
                  if (targetCityId && c.city_id === targetCityId) return true;
                  const fullCity = `${c.type} ${c.city_name}`.toLowerCase();
                  const tName = (targetCityName || '').toLowerCase();
                  if (fullCity === tName || c.city_name.toLowerCase() === tName) return true;
                  if (tName && normalizeCity(c.city_name) === normalizeCity(tName)) return true;
                  return false;
                }) || citiesList[0]
              : citiesList[0];

          matchedCityId = matchedCity.city_id;
          matchedCityName = matchedCity.city_name;
          matchedCityFormatted = matchedCity.city_name
            .toLowerCase()
            .startsWith(matchedCity.type.toLowerCase())
            ? matchedCity.city_name
            : `${matchedCity.type} ${matchedCity.city_name}`;
        }

        // Fetch subdistricts
        let matchedDistrictName = '';
        let matchedPostal = targetPostalCode || '';

        if (matchedCityId) {
          const { data: subRes } = await axios.get(
            `/api/v1/shipping/subdistricts?cityId=${matchedCityId}&cityName=${encodeURIComponent(matchedCityName)}`
          );

          if (subRes.code === 200 && Array.isArray(subRes.data) && subRes.data.length > 0) {
            const subsList = subRes.data;
            setSubdistricts(subsList);

            const matchedSub = targetDistrict
              ? subsList.find((s: { subdistrict_name: string }) => {
                  const sName = s.subdistrict_name.toLowerCase();
                  const tDist = targetDistrict.toLowerCase();
                  if (sName === tDist) return true;
                  if (normalizeDistrict(s.subdistrict_name) === normalizeDistrict(tDist))
                    return true;
                  return false;
                }) || subsList[0]
              : subsList[0];

            matchedDistrictName = matchedSub.subdistrict_name;
            if (!matchedPostal && matchedSub.postal_code) {
              matchedPostal = matchedSub.postal_code;
            }
          }
        }

        // Update form state with matched customer address
        setFormData((prev) => ({
          ...prev,
          fullName: customer?.fullName || prev.fullName,
          email: customer?.email || prev.email,
          whatsapp: customer?.whatsapp || prev.whatsapp,
          streetAddress: customer?.address || prev.streetAddress,
          province: matchedProv.province,
          city: matchedCityFormatted || prev.city,
          district: matchedDistrictName || prev.district,
          postalCode: matchedPostal || prev.postalCode
        }));
      } catch (err) {
        console.error('Failed to prefill customer shipping location:', err);
      }
    };

    if (customer?.id) {
      if (prefilledCustIdRef.current !== customer.id) {
        prefilledCustIdRef.current = customer.id;
        loadLocationsAndPrefill();
      }
    } else if (!isDefaultInitializedRef.current) {
      isDefaultInitializedRef.current = true;
      loadLocationsAndPrefill();
    }
  }, [customer]);

  // Timer countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Order items list depending on mode
  const orderItems = useMemo(() => {
    if (isCartMode) {
      return cartItems;
    }
    if (!product) return [];
    return [
      {
        id: `${product.id}-${selectedSize}-${selectedColor}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        size: selectedSize || 'M',
        color: selectedColor || product.color,
        quantity,
        isPreOrder: product.status === 'PRE_ORDER'
      }
    ];
  }, [isCartMode, cartItems, product, selectedSize, selectedColor, quantity]);

  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [orderItems]);

  const totalItemCount = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [orderItems]);

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
      (async () => {
        try {
          const { data: res } = await axios.get(
            `/api/v1/shipping/cities?provinceId=${matchedProv.province_id}&provinceName=${encodeURIComponent(matchedProv.province)}`
          );
          if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
            setCities(res.data);
            const defaultCity = `${res.data[0].type} ${res.data[0].city_name}`;
            setFormData((prev) => ({ ...prev, city: defaultCity }));

            try {
              const { data: sRes } = await axios.get(
                `/api/v1/shipping/subdistricts?cityId=${res.data[0].city_id}&cityName=${encodeURIComponent(res.data[0].city_name)}`
              );
              if (sRes.code === 200 && Array.isArray(sRes.data) && sRes.data.length > 0) {
                setSubdistricts(sRes.data);
                setFormData((prev) => ({
                  ...prev,
                  district: sRes.data[0].subdistrict_name,
                  postalCode: sRes.data[0].postal_code || prev.postalCode
                }));
              }
            } catch (err) {
              console.error('Failed to load subdistricts:', err);
            }
          } else {
            setCities([]);
            setSubdistricts([]);
          }
        } catch (err) {
          console.error('Failed to load cities:', err);
          toast.error('Gagal memuat daftar kota untuk provinsi yang dipilih.');
          setCities([]);
          setSubdistricts([]);
        } finally {
          setIsShippingLoading(false);
        }
      })();
    }
  };

  const handleCityChange = async (newCity: string) => {
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
      try {
        const { data: res } = await axios.get(
          `/api/v1/shipping/subdistricts?cityId=${matchedCity.city_id}&cityName=${encodeURIComponent(matchedCity.city_name)}`
        );
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
      } catch (err) {
        console.error('Failed to load subdistricts:', err);
        toast.error('Gagal memuat daftar kecamatan untuk kota yang dipilih.');
        setSubdistricts([]);
      }
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

  // Fetch Shipping rates when city changes
  useEffect(() => {
    if (!formData.city || cities.length === 0) return;

    const matchedCity = cities.find(
      (c) =>
        `${c.type} ${c.city_name}`.toLowerCase() === formData.city.toLowerCase() ||
        c.city_name.toLowerCase() === formData.city.toLowerCase()
    );

    if (!matchedCity) return;

    let isMounted = true;

    const fetchRates = async () => {
      setIsShippingLoading(true);
      setRajaRates([]);

      const weightInGrams = Math.max(1000, totalItemCount * 350);

      try {
        const results = await Promise.all(
          activeCourierCodes.map(async (courier) => {
            const { data } = await axios.post('/api/v1/shipping/cost', {
              destination: matchedCity.city_id,
              destinationType: 'city',
              weight: weightInGrams,
              courier
            });
            return data;
          })
        );

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
                  const serviceLabel = (function (courierCode: string, serviceName: string) {
                    const code = courierCode.toUpperCase().trim();
                    const srv = serviceName.trim();
                    const lowerSrv = srv.toLowerCase();
                    const lowerCode = code.toLowerCase();
                    if (
                      lowerSrv.startsWith(lowerCode) ||
                      (lowerCode === 'jnt' &&
                        (lowerSrv.startsWith('j&t') || lowerSrv.startsWith('jnt'))) ||
                      (lowerCode === 'sicepat' && lowerSrv.startsWith('sicepat'))
                    ) {
                      return srv;
                    }
                    return `${code} ${srv}`;
                  })(courierItem.code, costItem.service);

                  const price = costItem.cost[0]?.value || 0;
                  const rawEtd = costItem.cost[0]?.etd || '';
                  const etdText = rawEtd ? ` (${rawEtd.replace(/hari/i, '').trim()} Hari)` : '';
                  const keyName = `${courierItem.code.toUpperCase()} ${costItem.service}`;
                  const labelText = `${serviceLabel}${etdText} — ${formatPrice(price)}`;

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
      } catch (err) {
        console.error('Failed to fetch RajaOngkir rates:', err);
        toast.error('Gagal memuat tarif ongkos kirim. Silakan coba lagi.');
      } finally {
        if (isMounted) {
          setIsShippingLoading(false);
        }
      }
    };

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, [formData.city, cities, totalItemCount, activeCourierCodes]);

  // Request OTP
  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }

    setDevOtpHint(null);
    try {
      const data = await sendOrderOtpMutation.mutateAsync({ email: formData.email });
      setOtpSent(true);
      setCountdown(60);
      toast.success('Kode OTP telah dikirim ke email Anda.');
      if (data.isDevMode && data.message) {
        setDevOtpHint(data.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim OTP.');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      toast.error('Masukkan 6 digit kode OTP.');
      return;
    }

    try {
      await verifyOrderOtpMutation.mutateAsync({
        email: formData.email,
        code: otpCode
      });
      setIsOtpVerified(true);
      toast.success('Email berhasil diverifikasi!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verifikasi OTP gagal.');
    }
  };

  const selectedRate = rajaRates.find((rate) => rate.key === formData.courierService);
  const shippingFee = selectedRate?.cost || 0;
  const totalPrice = subtotal + shippingFee;

  const isEmailVerified =
    isOtpVerified || Boolean(isAuthenticated && customer && customer.email === formData.email);

  // Handle final checkout submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!isEmailVerified) {
      setSubmitError('Silakan verifikasi email dengan kode OTP terlebih dahulu.');
      toast.error('Verifikasi email dengan kode OTP terlebih dahulu.');
      return;
    }

    if (orderItems.length === 0) {
      setSubmitError('Tidak ada produk yang dipesan.');
      return;
    }

    if (!selectedRate) {
      setSubmitError('Pilih opsi pengiriman terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = `${formData.streetAddress.trim()}, ${formData.district}, ${formData.city}, ${formData.province} ${formData.postalCode}`;

      const res = await withActionLoading(
        () =>
          submitOrder(
            {
              fullName: formData.fullName.trim(),
              email: formData.email.trim(),
              whatsapp: formData.whatsapp.trim(),
              address: fullAddress,
              notes: formData.notes.trim() || undefined,
              totalPrice,
              shippingFee,
              otpCode: isOtpVerified ? otpCode || '000000' : undefined,
              shipping: {
                destination: selectedRate.destination,
                courier: selectedRate.courierCode,
                service: selectedRate.service
              },
              items: orderItems.map((item) => ({
                productId: item.productId,
                color: item.color,
                size: item.size,
                quantity: item.quantity
              }))
            },
            customerToken || undefined
          ),
        'Mengirim pesanan Anda...'
      );

      // Clear cart if ordered from cart
      if (isCartMode) {
        clearCart();
      }

      const orderNum = res.data.orderNumber;
      router.push(`/order/confirmation/${orderNum}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Pesanan gagal dikirim. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    orderItems.length > 0 &&
    !!selectedRate &&
    !isShippingLoading &&
    !!formData.fullName.trim() &&
    !!formData.email.trim() &&
    !!formData.whatsapp.trim() &&
    !!formData.province &&
    !!formData.city &&
    !!formData.district &&
    !!formData.streetAddress.trim() &&
    (isOtpVerified || (isAuthenticated && customer?.email === formData.email));

  return (
    <div className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
      {/* Breadcrumb & Header */}
      <nav
        className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/catalogue" className="hover:text-(--cat-on-surface) transition-colors">
          Catalogue
        </Link>
        <span className="mx-2">/</span>
        <span className="text-(--cat-on-surface) font-semibold">Checkout</span>
      </nav>

      <h1 className="font-eb-garamond text-[32px] md:text-[42px] font-normal text-(--cat-on-surface) mb-8">
        Lengkapi Data Pesanan
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Left: Order Summary */}
          <div className="md:col-span-5 order-2 md:order-1">
            <div className="border border-(--cat-stone) bg-(--cat-surface-container-low) p-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-(--cat-stone)">
                <h2 className="font-eb-garamond text-[20px] font-normal text-(--cat-on-surface)">
                  Ringkasan Pesanan ({totalItemCount} Item)
                </h2>
                {isCartMode && (
                  <Link
                    href="/catalogue"
                    className="font-hanken text-[11px] text-(--cat-on-surface-variant) underline hover:text-(--cat-on-surface)"
                  >
                    Tambah Produk
                  </Link>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-(--cat-stone)/60 max-h-80 overflow-y-auto pr-1">
                {orderItems.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="relative w-16 h-20 shrink-0 overflow-hidden bg-(--cat-surface-container)">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-hanken text-[14px] font-medium text-(--cat-on-surface) truncate">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 font-hanken text-[12px] text-(--cat-on-surface-variant)">
                        Size: {item.size} / <span className="capitalize">{item.color}</span>
                        {item.isPreOrder && (
                          <span className="ml-1 text-amber-600 font-medium">(Pre-Order)</span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-hanken text-[12px] text-(--cat-on-surface-variant)">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-hanken text-[14px] font-medium text-(--cat-on-surface) tabular-nums">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="mt-4 pt-4 border-t border-(--cat-stone) space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
                    Subtotal Produk
                  </span>
                  <span className="font-hanken text-[14px] text-(--cat-on-surface) tabular-nums font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="font-hanken text-[13px] text-(--cat-on-surface-variant) flex items-center gap-1.5">
                    <Truck size={14} className="opacity-70 shrink-0 mt-0.5" />
                    <div>
                      <span>Ongkos Kirim</span>
                      {selectedRate && <p className="text-[11px] opacity-75">{selectedRate.key}</p>}
                    </div>
                  </span>
                  <span className="font-hanken text-[14px] text-(--cat-on-surface) tabular-nums font-semibold">
                    {isShippingLoading ? (
                      <Loader2 size={14} className="animate-spin text-(--cat-charcoal) inline" />
                    ) : selectedRate ? (
                      formatPrice(shippingFee)
                    ) : (
                      'Belum dihitung'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-(--cat-stone) font-hanken">
                  <span className="text-[14px] font-semibold uppercase tracking-[0.06em] text-(--cat-on-surface)">
                    Total Pembayaran
                  </span>
                  <span className="text-[20px] font-bold text-(--cat-on-surface) tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Customer Form & OTP Verification */}
          <div className="md:col-span-7 order-1 md:order-2 space-y-6">
            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-[13px] font-hanken flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-(--cat-surface-container-low) border border-(--cat-stone) p-6">
              <h2 className="font-eb-garamond text-[20px] font-normal text-(--cat-on-surface) mb-4">
                Informasi Kontak Pemesan
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nama Lengkap Anda"
                    className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    No. WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={Boolean(isAuthenticated && customer)}
                    value={formData.whatsapp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="081234567890"
                    className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors disabled:cursor-not-allowed disabled:bg-(--cat-surface-container-low) disabled:text-(--cat-on-surface-variant) disabled:opacity-100"
                  />
                  {isAuthenticated && customer ? (
                    <p className="mt-1 font-hanken text-[11px] text-(--cat-on-surface-variant)">
                      Nomor mengikuti profil terverifikasi.{' '}
                      <Link
                        href="/customer/account#profil"
                        className="font-semibold text-(--cat-on-surface) underline underline-offset-2"
                      >
                        Ganti nomor di Profil
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-1 font-hanken text-[11px] text-(--cat-on-surface-variant)">
                      Kami akan mengirim konfirmasi pesanan dan instruksi pembayaran transfer bank
                      via WhatsApp ini.
                    </p>
                  )}
                </div>

                {/* Email & OTP Section */}
                <div className="pt-2">
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Alamat Email (Gmail / Email Aktif) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        required
                        disabled={isEmailVerified && isAuthenticated}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, email: e.target.value }));
                          if (isOtpVerified) setIsOtpVerified(false);
                        }}
                        placeholder="nama@email.com"
                        className={cn(
                          'w-full h-11 pl-10 pr-10 font-hanken text-[14px] text-(--cat-on-surface) border focus:outline-none transition-colors disabled:opacity-100 disabled:bg-(--cat-surface-container-low) disabled:text-(--cat-on-surface)',
                          isEmailVerified
                            ? 'border-(--cat-charcoal) bg-(--cat-surface-container-low)'
                            : 'bg-(--cat-surface) border-(--cat-stone) focus:border-(--cat-charcoal)'
                        )}
                      />
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
                        size={16}
                      />
                      {isEmailVerified && (
                        <CheckCircle2
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--cat-charcoal)"
                          size={16}
                        />
                      )}
                    </div>

                    {!isEmailVerified && (
                      <button
                        type="button"
                        disabled={isSendingOtp || countdown > 0 || !formData.email.includes('@')}
                        onClick={handleSendOtp}
                        className={cn(
                          'px-4 h-11 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] shrink-0 transition-opacity cursor-pointer flex items-center gap-1.5',
                          isSendingOtp || countdown > 0 || !formData.email.includes('@')
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:opacity-90'
                        )}
                      >
                        {isSendingOtp ? (
                          <Loader2 className="animate-spin" size={13} />
                        ) : countdown > 0 ? (
                          `${countdown}s`
                        ) : (
                          <>
                            <Send size={12} /> Kirim OTP
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {devOtpHint && !isEmailVerified && (
                    <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-mono rounded shadow-xs leading-relaxed">
                      <span className="font-bold text-amber-900">⚡ DEV MODE:</span>{' '}
                      {devOtpHint.replace('[DEV MODE] ', '')}
                    </div>
                  )}

                  {/* OTP Verification Input Box */}
                  {!isEmailVerified && otpSent && (
                    <div className="mt-3 p-4 bg-(--cat-surface) border border-(--cat-stone) space-y-3 animate-in fade-in duration-200">
                      <p className="font-hanken text-[12px] text-(--cat-on-surface)">
                        Masukkan 6-digit kode verifikasi yang dikirim ke{' '}
                        <strong>{formData.email}</strong>:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-36 h-10 text-center tracking-[6px] font-mono text-[18px] font-bold bg-(--cat-surface-container-low) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          onClick={handleVerifyOtp}
                          className={cn(
                            'px-5 h-10 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] cursor-pointer transition-opacity',
                            isVerifyingOtp || otpCode.length !== 6
                              ? 'opacity-60 cursor-not-allowed'
                              : 'hover:opacity-90'
                          )}
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            'Verifikasi'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isEmailVerified && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-hanken font-medium text-(--cat-charcoal)">
                        <CheckCircle2 size={13} className="text-(--cat-charcoal)" />
                        {isAuthenticated && customer?.email === formData.email
                          ? 'Email Akun Terverifikasi'
                          : 'Email Berhasil Diverifikasi via OTP'}
                      </span>
                      {!isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpVerified(false);
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="text-[11px] font-hanken text-(--cat-on-surface-variant) underline hover:text-(--cat-on-surface) cursor-pointer"
                        >
                          Ganti Email
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-(--cat-surface-container-low) border border-(--cat-stone) p-6 space-y-4">
              <h2 className="font-eb-garamond text-[20px] font-normal text-(--cat-on-surface)">
                Alamat Pengiriman
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Provinsi <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={provinces.map((p) => p.province)}
                    value={formData.province}
                    onValueChange={handleProvinceChange}
                    placeholder="Pilih Provinsi"
                  />
                </div>

                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Kota / Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={availableCities}
                    value={formData.city}
                    onValueChange={handleCityChange}
                    placeholder="Pilih Kota/Kabupaten"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={availableDistricts}
                    value={formData.district}
                    onValueChange={handleDistrictChange}
                    placeholder="Pilih Kecamatan"
                  />
                </div>

                <div>
                  <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                    Kode Pos
                  </label>
                  <SearchableSelect
                    options={availablePostalCodes}
                    value={formData.postalCode}
                    onValueChange={(val: string) =>
                      setFormData((prev) => ({ ...prev, postalCode: val }))
                    }
                    placeholder="Kode Pos"
                  />
                </div>
              </div>

              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Alamat Lengkap (Nama Jalan, No. Rumah, RT/RW, Patokan){' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.streetAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, streetAddress: e.target.value }))
                  }
                  placeholder="Contoh: Jl. Kemang Raya No. 45B, RT 02/RW 04, Depan Coffee Shop"
                  className="w-full p-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>

              {/* Courier Selection */}
              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Pilihan Ekspedisi & Layanan Ongkir <span className="text-red-500">*</span>
                </label>
                {isShippingLoading ? (
                  <div className="h-11 flex items-center px-3 bg-(--cat-surface) border border-(--cat-stone) text-(--cat-on-surface-variant) text-[13px] font-hanken">
                    <Loader2 size={14} className="animate-spin mr-2" /> Menghitung ongkir ke{' '}
                    {formData.city}...
                  </div>
                ) : rajaRates.length === 0 ? (
                  <div className="h-11 flex items-center px-3 bg-(--cat-surface) border border-(--cat-stone) text-(--cat-on-surface-variant) text-[13px] font-hanken">
                    Pilih Kota/Kabupaten untuk melihat opsi ongkir
                  </div>
                ) : (
                  <select
                    value={formData.courierService}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, courierService: e.target.value }))
                    }
                    className="w-full h-11 px-3 font-hanken text-[13px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none"
                  >
                    {rajaRates.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Catatan Pesanan (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Contoh: Tolong titipkan di pos satpam jika tidak ada orang"
                  className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                'w-full py-4 flex items-center justify-center gap-2 font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-150',
                isValid && !isSubmitting
                  ? 'bg-(--cat-charcoal) text-white hover:opacity-90 cursor-pointer shadow-sm'
                  : 'bg-(--cat-surface-container-high) text-(--cat-on-surface-variant)/50 border border-(--cat-stone) cursor-not-allowed opacity-75'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Memproses Pesanan...
                </>
              ) : (
                <>
                  Kirim Permintaan Pesanan <ArrowRight size={16} />
                </>
              )}
            </button>

            {!isEmailVerified && (
              <p className="mt-2 text-center font-hanken text-[11px] text-(--cat-on-surface-variant)/80">
                Silakan kirim dan verifikasi kode OTP email di atas untuk mengaktifkan pemesanan.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-350 px-4 md:px-16 py-16 text-center font-hanken text-[13px] text-(--cat-on-surface-variant)">
          <Loader2 className="animate-spin inline-block mr-2" size={16} /> Memuat halaman
          pemesanan...
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
