'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useCustomerStore, type Customer } from '@/lib/customer-store';
import { useUpdateCustomerProfile } from '@/hooks/use-customer-account';
import {
  useShippingProvinces,
  useShippingCities,
  useShippingSubdistricts
} from '@/hooks/use-shipping-locations';
import { SearchableSelect } from '@/components/catalogue/searchable-select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomerProfileFormProps {
  customer: Customer;
}

export function CustomerProfileForm({ customer }: CustomerProfileFormProps) {
  const [fullName, setFullName] = useState(customer.fullName || '');
  const [whatsapp, setWhatsapp] = useState(customer.whatsapp || '');
  const [address, setAddress] = useState(customer.address || '');
  const [provinceName, setProvinceName] = useState(customer.provinceName || '');
  const [cityName, setCityName] = useState(customer.cityName || '');
  const [cityId, setCityId] = useState(customer.cityId || '');
  const [district, setDistrict] = useState(customer.district || '');
  const [postalCode, setPostalCode] = useState(customer.postalCode || '');

  const updateProfileMutation = useUpdateCustomerProfile();

  // Location Queries
  const { data: provinces = [], isLoading: isLoadingProvinces } = useShippingProvinces();

  const matchedProv = useMemo(() => {
    return provinces.find(
      (p) => p.province.toLowerCase() === provinceName.toLowerCase()
    );
  }, [provinces, provinceName]);

  const { data: cities = [], isLoading: isLoadingCities } = useShippingCities(
    matchedProv?.province_id,
    provinceName
  );

  const matchedCity = useMemo(() => {
    return cities.find(
      (c) =>
        `${c.type} ${c.city_name}`.toLowerCase() === cityName.toLowerCase() ||
        c.city_name.toLowerCase() === cityName.toLowerCase() ||
        (cityId && c.city_id === cityId)
    );
  }, [cities, cityName, cityId]);

  const { data: subdistricts = [], isLoading: isLoadingSubdistricts } = useShippingSubdistricts(
    matchedCity?.city_id,
    matchedCity?.city_name
  );

  useEffect(() => {
    setFullName(customer.fullName || '');
    setWhatsapp(customer.whatsapp || '');
    setAddress(customer.address || '');
    setProvinceName(customer.provinceName || '');
    setCityName(customer.cityName || '');
    setCityId(customer.cityId || '');
    setDistrict(customer.district || '');
    setPostalCode(customer.postalCode || '');
  }, [customer]);

  const availableCities = useMemo(() => {
    return cities.map((c) => `${c.type} ${c.city_name}`);
  }, [cities]);

  const availableSubdistricts = useMemo(() => {
    return subdistricts.map((s) => s.subdistrict_name);
  }, [subdistricts]);

  const handleProvinceChange = (newProvince: string) => {
    setProvinceName(newProvince);
    setCityName('');
    setCityId('');
    setDistrict('');
    setPostalCode('');
  };

  const handleCityChange = (newCity: string) => {
    const matched = cities.find(
      (c) =>
        `${c.type} ${c.city_name}`.toLowerCase() === newCity.toLowerCase() ||
        c.city_name.toLowerCase() === newCity.toLowerCase()
    );

    setCityName(newCity);
    setCityId(matched?.city_id || '');
    setDistrict('');
    setPostalCode('');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const matched = subdistricts.find(
      (s) => s.subdistrict_name.toLowerCase() === newDistrict.toLowerCase()
    );
    if (matched?.postal_code) {
      setPostalCode(matched.postal_code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        provinceName: provinceName.trim(),
        cityName: cityName.trim(),
        cityId: cityId || undefined,
        district: district.trim(),
        postalCode: postalCode.trim()
      });
      toast.success('Profil & alamat default berhasil diperbarui.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui profil.');
    }
  };

  return (
    <div className="max-w-2xl bg-(--cat-surface-container-low) border border-(--cat-stone) p-6 md:p-8">
      <h2 className="font-eb-garamond text-[22px] text-(--cat-on-surface) mb-6">
        Informasi Akun & Alamat Default
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
            Email Akun
          </label>
          <input
            type="email"
            disabled
            value={customer.email}
            className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface-container) border border-(--cat-stone) text-(--cat-on-surface-variant) cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Lengkap Anda"
            className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
            Nomor WhatsApp
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="081234567890"
            className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
            Alamat Lengkap Jalan / Gedung
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jl. Contoh No. 123, RT 01/RW 02"
            className="w-full p-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
          />
        </div>

        {/* RajaOngkir Dropdown Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
              Provinsi
            </label>
            <SearchableSelect
              options={provinces.map((p) => p.province)}
              value={provinceName}
              onValueChange={handleProvinceChange}
              placeholder="Pilih Provinsi"
              isLoading={isLoadingProvinces}
            />
          </div>

          <div>
            <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
              Kota / Kabupaten
            </label>
            <SearchableSelect
              options={availableCities}
              value={cityName}
              onValueChange={handleCityChange}
              placeholder={provinceName ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi terlebih dahulu'}
              disabled={!provinceName}
              isLoading={isLoadingCities}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
              Kecamatan
            </label>
            <SearchableSelect
              options={availableSubdistricts}
              value={district}
              onValueChange={handleDistrictChange}
              placeholder={cityName ? 'Pilih Kecamatan' : 'Pilih Kota terlebih dahulu'}
              disabled={!cityName}
              isLoading={isLoadingSubdistricts}
            />
          </div>

          <div>
            <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
              Kode Pos
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12345"
              className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className={cn(
            'mt-6 inline-flex items-center justify-center gap-2 px-8 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity cursor-pointer',
            updateProfileMutation.isPending ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
          )}
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={14} /> Menyimpan...
            </>
          ) : (
            <>
              <Save size={14} /> Simpan Perubahan
            </>
          )}
        </button>
      </form>
    </div>
  );
}
