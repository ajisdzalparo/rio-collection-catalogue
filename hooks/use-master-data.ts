'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { env } from '@/config/env';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
}

export interface SizeItem {
  size: string;
  isActive: boolean;
}

export interface TopicItem {
  id: string;
  name: string;
  description?: string;
}

export interface EditionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  releaseYear?: string;
}

interface MasterDataState {
  categories: CategoryItem[];
  colors: ColorItem[];
  sizes: SizeItem[];
  topics: TopicItem[];
  editions: EditionItem[];

  // Setters for seeding from mock API
  setCategories: (categories: CategoryItem[]) => void;
  setColors: (colors: ColorItem[]) => void;
  setSizes: (sizes: SizeItem[]) => void;
  setTopics: (topics: TopicItem[]) => void;
  setEditions: (editions: EditionItem[]) => void;

  // Categories CRUD
  addCategory: (name: string, description?: string) => void;
  updateCategory: (id: string, name: string, description?: string) => void;
  deleteCategory: (id: string) => void;

  // Colors CRUD
  addColor: (name: string, hex: string) => void;
  updateColor: (id: string, name: string, hex: string) => void;
  deleteColor: (id: string) => void;

  // Sizes Actions
  toggleSize: (size: string) => void;

  // Topics CRUD
  addTopic: (name: string, description?: string) => void;
  updateTopic: (id: string, name: string, description?: string) => void;
  deleteTopic: (id: string) => void;

  // Editions CRUD
  addEdition: (name: string, description?: string, releaseYear?: string) => void;
  updateEdition: (id: string, name: string, description?: string, releaseYear?: string) => void;
  deleteEdition: (id: string) => void;
}

const getSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const useMasterStore = create<MasterDataState>()(
  persist(
    (set) => ({
      categories: [],
      colors: [],
      sizes: [],
      topics: [],
      editions: [],

      // Setters
      setCategories: (categories) => set({ categories }),
      setColors: (colors) => set({ colors }),
      setSizes: (sizes) => set({ sizes }),
      setTopics: (topics) => set({ topics }),
      setEditions: (editions) => set({ editions }),

      // Categories
      addCategory: (name, description) => set((state) => ({
        categories: [
          ...state.categories,
          { id: `cat-${Date.now()}`, name, slug: getSlug(name), description }
        ]
      })),
      updateCategory: (id, name, description) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, name, slug: getSlug(name), description } : c
        )
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),

      // Colors
      addColor: (name, hex) => set((state) => ({
        colors: [
          ...state.colors,
          { id: `col-${Date.now()}`, name, hex }
        ]
      })),
      updateColor: (id, name, hex) => set((state) => ({
        colors: state.colors.map((c) =>
          c.id === id ? { ...c, name, hex } : c
        )
      })),
      deleteColor: (id) => set((state) => ({
        colors: state.colors.filter((c) => c.id !== id)
      })),

      // Sizes
      toggleSize: (size) => set((state) => ({
        sizes: state.sizes.map((s) =>
          s.size === size ? { ...s, isActive: !s.isActive } : s
        )
      })),

      // Topics
      addTopic: (name, description) => set((state) => ({
        topics: [
          ...state.topics,
          { id: `top-${Date.now()}`, name: name.toUpperCase(), description }
        ]
      })),
      updateTopic: (id, name, description) => set((state) => ({
        topics: state.topics.map((t) =>
          t.id === id ? { ...t, name: name.toUpperCase(), description } : t
        )
      })),
      deleteTopic: (id) => set((state) => ({
        topics: state.topics.filter((t) => t.id !== id)
      })),

      // Editions
      addEdition: (name, description, releaseYear) => set((state) => ({
        editions: [
          ...state.editions,
          { id: `ed-${Date.now()}`, name, slug: getSlug(name), description, releaseYear: releaseYear || '2026' }
        ]
      })),
      updateEdition: (id, name, description, releaseYear) => set((state) => ({
        editions: state.editions.map((e) =>
          e.id === id ? { ...e, name, slug: getSlug(name), description, releaseYear } : e
        )
      })),
      deleteEdition: (id) => set((state) => ({
        editions: state.editions.filter((e) => e.id !== id)
      }))
    }),
    {
      name: 'rio-master-data-store'
    }
  )
);

// React Query hooks for fetching from VeloMock Staging Mock API
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['mock-categories'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/categories`);
      if (data.code === 200 && data.data) {
        return data.data as CategoryItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useColorsQuery() {
  return useQuery({
    queryKey: ['mock-colors'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/colors`);
      if (data.code === 200 && data.data) {
        return data.data as ColorItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useSizesQuery() {
  return useQuery({
    queryKey: ['mock-sizes'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/sizes`);
      if (data.code === 200 && data.data) {
        return data.data as SizeItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useTopicsQuery() {
  return useQuery({
    queryKey: ['mock-topics'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/topics`);
      if (data.code === 200 && data.data) {
        return data.data as TopicItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useEditionsQuery() {
  return useQuery({
    queryKey: ['mock-editions'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/editions`);
      if (data.code === 200 && data.data) {
        return data.data as EditionItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}
