'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  deletedAt?: string | null;
}

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
  isActive: boolean;
  deletedAt?: string | null;
}

export interface SizeItem {
  size: string;
  isActive: boolean;
  deletedAt?: string | null;
}

export interface TopicItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  deletedAt?: string | null;
}

export interface BankItem {
  id: string;
  name: string;
  code?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
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
  banks: BankItem[];

  // Setters for seeding from mock API
  setCategories: (categories: CategoryItem[]) => void;
  setColors: (colors: ColorItem[]) => void;
  setSizes: (sizes: SizeItem[]) => void;
  setTopics: (topics: TopicItem[]) => void;
  setEditions: (editions: EditionItem[]) => void;
  setBanks: (banks: BankItem[]) => void;

  // Categories CRUD
  addCategory: (name: string, description?: string) => void;
  updateCategory: (id: string, name?: string, description?: string, isActive?: boolean) => void;
  deleteCategory: (id: string) => void;

  // Colors CRUD
  addColor: (name: string, hex: string) => void;
  updateColor: (id: string, name?: string, hex?: string, isActive?: boolean) => void;
  deleteColor: (id: string) => void;

  // Sizes Actions
  toggleSize: (size: string) => void;

  // Topics CRUD
  addTopic: (name: string, description?: string) => void;
  updateTopic: (id: string, name?: string, description?: string, isActive?: boolean) => void;
  deleteTopic: (id: string) => void;

  // Editions CRUD
  addEdition: (name: string, description?: string, releaseYear?: string) => void;
  updateEdition: (id: string, name: string, description?: string, releaseYear?: string) => void;
  deleteEdition: (id: string) => void;

  // Banks CRUD
  addBank: (name: string, code?: string, logoUrl?: string) => void;
  updateBank: (id: string, name?: string, code?: string, logoUrl?: string, isActive?: boolean) => void;
  deleteBank: (id: string) => void;
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
      banks: [],

      // Setters
      setCategories: (categories) => set({ categories }),
      setColors: (colors) => set({ colors }),
      setSizes: (sizes) => set({ sizes }),
      setTopics: (topics) => set({ topics }),
      setEditions: (editions) => set({ editions }),
      setBanks: (banks) => set({ banks }),

      // Categories
      addCategory: (name, description) => set((state) => ({
        categories: [
          ...state.categories,
          { id: `cat-${Date.now()}`, name, slug: getSlug(name), description, isActive: true }
        ]
      })),
      updateCategory: (id, name, description, isActive) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id
            ? {
                ...c,
                name: name !== undefined ? name : c.name,
                slug: name !== undefined ? getSlug(name) : c.slug,
                description: description !== undefined ? description : c.description,
                isActive: isActive !== undefined ? isActive : c.isActive
              }
            : c
        )
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),

      // Colors
      addColor: (name, hex) => set((state) => ({
        colors: [
          ...state.colors,
          { id: `col-${Date.now()}`, name, hex, isActive: true }
        ]
      })),
      updateColor: (id, name, hex, isActive) => set((state) => ({
        colors: state.colors.map((c) =>
          c.id === id
            ? {
                ...c,
                name: name !== undefined ? name : c.name,
                hex: hex !== undefined ? hex : c.hex,
                isActive: isActive !== undefined ? isActive : c.isActive
              }
            : c
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
          { id: `top-${Date.now()}`, name: name.toUpperCase(), description, isActive: true }
        ]
      })),
      updateTopic: (id, name, description, isActive) => set((state) => ({
        topics: state.topics.map((t) =>
          t.id === id
            ? {
                ...t,
                name: name !== undefined ? name.toUpperCase() : t.name,
                description: description !== undefined ? description : t.description,
                isActive: isActive !== undefined ? isActive : t.isActive
              }
            : t
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
      })),

      // Banks
      addBank: (name, code, logoUrl) => set((state) => ({
        banks: [
          ...state.banks,
          { id: `bank-${Date.now()}`, name, code: code || name.toUpperCase(), logoUrl, isActive: true }
        ]
      })),
      updateBank: (id, name, code, logoUrl, isActive) => set((state) => ({
        banks: state.banks.map((b) =>
          b.id === id
            ? {
                ...b,
                name: name !== undefined ? name : b.name,
                code: code !== undefined ? code : b.code,
                logoUrl: logoUrl !== undefined ? logoUrl : b.logoUrl,
                isActive: isActive !== undefined ? isActive : b.isActive
              }
            : b
        )
      })),
      deleteBank: (id) => set((state) => ({
        banks: state.banks.filter((b) => b.id !== id)
      }))
    }),
    {
      name: 'rio-master-data-store'
    }
  )
);

// React Query hooks for fetching from native backend API
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/categories');
      if (data.code === 200 && data.data) {
        return data.data as CategoryItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useColorsQuery() {
  return useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/colors');
      if (data.code === 200 && data.data) {
        return data.data as ColorItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useSizesQuery() {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/sizes');
      if (data.code === 200 && data.data) {
        return data.data as SizeItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useTopicsQuery() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/topics');
      if (data.code === 200 && data.data) {
        return data.data as TopicItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useEditionsQuery() {
  return useQuery({
    queryKey: ['editions'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/categories');
      if (data.code === 200 && data.data) {
        return data.data as EditionItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useBanksQuery(activeOnly = false) {
  return useQuery({
    queryKey: ['banks', activeOnly],
    queryFn: async () => {
      const { data } = await axios.get(`/api/v1/banks${activeOnly ? '?activeOnly=true' : ''}`);
      if (data.code === 200 && data.data) {
        return data.data as BankItem[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useMasterMutations() {
  const queryClient = useQueryClient();

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data } = await axios.post('/api/v1/categories', { name, description });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, description, isActive }: { id: string; name?: string; description?: string; isActive?: boolean }) => {
      const { data } = await axios.put(`/api/v1/categories/${id}`, { name, description, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/categories/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const addColorMutation = useMutation({
    mutationFn: async ({ name, hex }: { name: string; hex: string }) => {
      const { data } = await axios.post('/api/v1/colors', { name, hex });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colors'] })
  });

  const updateColorMutation = useMutation({
    mutationFn: async ({ id, name, hex, isActive }: { id: string; name?: string; hex?: string; isActive?: boolean }) => {
      const { data } = await axios.put(`/api/v1/colors/${id}`, { name, hex, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colors'] })
  });

  const deleteColorMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/colors/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['colors'] })
  });

  const addTopicMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data } = await axios.post('/api/v1/topics', { name, description });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] })
  });

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, name, description, isActive }: { id: string; name?: string; description?: string; isActive?: boolean }) => {
      const { data } = await axios.put(`/api/v1/topics/${id}`, { name, description, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] })
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/topics/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] })
  });

  const toggleSizeMutation = useMutation({
    mutationFn: async ({ size, isActive }: { size: string; isActive: boolean }) => {
      const { data } = await axios.put(`/api/v1/sizes/${size}`, { isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sizes'] })
  });

  const addBankMutation = useMutation({
    mutationFn: async ({ name, code, logoUrl, isActive }: { name: string; code?: string; logoUrl?: string; isActive?: boolean }) => {
      const { data } = await axios.post('/api/v1/banks', { name, code, logoUrl, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({ id, name, code, logoUrl, isActive }: { id: string; name?: string; code?: string; logoUrl?: string; isActive?: boolean }) => {
      const { data } = await axios.put(`/api/v1/banks/${id}`, { name, code, logoUrl, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/banks/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  return {
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    addColor: addColorMutation.mutateAsync,
    updateColor: updateColorMutation.mutateAsync,
    deleteColor: deleteColorMutation.mutateAsync,
    addTopic: addTopicMutation.mutateAsync,
    updateTopic: updateTopicMutation.mutateAsync,
    deleteTopic: deleteTopicMutation.mutateAsync,
    toggleSize: toggleSizeMutation.mutateAsync,
    addBank: addBankMutation.mutateAsync,
    updateBank: updateBankMutation.mutateAsync,
    deleteBank: deleteBankMutation.mutateAsync
  };
}
