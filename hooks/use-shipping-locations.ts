'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Province {
  province_id: string;
  province: string;
}

export interface City {
  city_id: string;
  province_id: string;
  city_name: string;
  type: string;
  postal_code?: string;
}

export interface Subdistrict {
  subdistrict_id: string;
  province_id?: string;
  province?: string;
  city_id?: string;
  city?: string;
  type?: string;
  subdistrict_name: string;
  postal_code?: string;
}

export function useShippingProvinces() {
  return useQuery<Province[], Error>({
    queryKey: ['shipping', 'provinces'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/shipping/provinces');
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24 // 24 hours cache
  });
}

export function useShippingCities(provinceId?: string, provinceName?: string) {
  return useQuery<City[], Error>({
    queryKey: ['shipping', 'cities', provinceId, provinceName],
    queryFn: async () => {
      if (!provinceId && !provinceName) return [];
      const params = new URLSearchParams();
      if (provinceId) params.set('provinceId', provinceId);
      if (provinceName) params.set('provinceName', provinceName);

      const { data } = await axios.get(`/api/v1/shipping/cities?${params.toString()}`);
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
    enabled: Boolean(provinceId || provinceName),
    staleTime: 1000 * 60 * 60 * 24
  });
}

export function useShippingSubdistricts(cityId?: string, cityName?: string) {
  return useQuery<Subdistrict[], Error>({
    queryKey: ['shipping', 'subdistricts', cityId, cityName],
    queryFn: async () => {
      if (!cityId && !cityName) return [];
      const params = new URLSearchParams();
      if (cityId) params.set('cityId', cityId);
      if (cityName) params.set('cityName', cityName);

      const { data } = await axios.get(`/api/v1/shipping/subdistricts?${params.toString()}`);
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
    enabled: Boolean(cityId || cityName),
    staleTime: 1000 * 60 * 60 * 24
  });
}
