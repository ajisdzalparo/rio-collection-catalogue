'use client';

import { create } from 'zustand';
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

export interface MaterialItem {
  id: string;
  type: 'FABRIC' | 'TREATMENT' | 'ORIGIN' | 'CARE';
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export type MasterDataResource =
  | 'categories'
  | 'colors'
  | 'sizes'
  | 'topics'
  | 'banks'
  | 'materials';

export function useMasterDataPageQuery<T>(
  resource: MasterDataResource,
  params: { search?: string; type?: string; page: number; pageSize: number },
  enabled = true
) {
  return useQuery<{
    items: T[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>({
    queryKey: [resource, 'page', params],
    enabled,
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/master-data', {
        params: { resource, ...params }
      });
      if (data.code !== 200 || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Gagal memuat master data.');
      }
      return { items: data.data as T[], meta: data.meta };
    },
    placeholderData: (previousData) => previousData
  });
}

interface MasterDataState {
  categories: CategoryItem[];
  colors: ColorItem[];
  sizes: SizeItem[];
  topics: TopicItem[];
  banks: BankItem[];
  materials: MaterialItem[];

  // Setters for seeding from API
  setCategories: (categories: CategoryItem[]) => void;
  setColors: (colors: ColorItem[]) => void;
  setSizes: (sizes: SizeItem[]) => void;
  setTopics: (topics: TopicItem[]) => void;
  setBanks: (banks: BankItem[]) => void;
  setMaterials: (materials: MaterialItem[]) => void;

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
  addSize: (size: string) => void;
  deleteSize: (size: string) => void;

  // Topics CRUD
  addTopic: (name: string, description?: string) => void;
  updateTopic: (id: string, name?: string, description?: string, isActive?: boolean) => void;
  deleteTopic: (id: string) => void;

  // Banks CRUD
  addBank: (name: string, code?: string, logoUrl?: string) => void;
  updateBank: (
    id: string,
    name?: string,
    code?: string,
    logoUrl?: string,
    isActive?: boolean
  ) => void;
  deleteBank: (id: string) => void;
}

export const useMasterStore = create<MasterDataState>()((set) => ({
  categories: [],
  colors: [],
  sizes: [],
  topics: [],
  banks: [],
  materials: [],

  setCategories: (categories) => set({ categories }),
  setColors: (colors) => set({ colors }),
  setSizes: (sizes) => set({ sizes }),
  setTopics: (topics) => set({ topics }),
  setBanks: (banks) => set({ banks }),
  setMaterials: (materials) => set({ materials }),

  addCategory: (name, description) =>
    set((state) => ({
      categories: [
        ...state.categories,
        {
          id: `cat-${Date.now()}`,
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          description,
          isActive: true
        }
      ]
    })),

  updateCategory: (id, name, description, isActive) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id
          ? {
              ...c,
              ...(name !== undefined && { name, slug: name.toLowerCase().replace(/\s+/g, '-') }),
              ...(description !== undefined && { description }),
              ...(isActive !== undefined && { isActive })
            }
          : c
      )
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id)
    })),

  addColor: (name, hex) =>
    set((state) => ({
      colors: [...state.colors, { id: `col-${Date.now()}`, name, hex, isActive: true }]
    })),

  updateColor: (id, name, hex, isActive) =>
    set((state) => ({
      colors: state.colors.map((c) =>
        c.id === id
          ? {
              ...c,
              ...(name !== undefined && { name }),
              ...(hex !== undefined && { hex }),
              ...(isActive !== undefined && { isActive })
            }
          : c
      )
    })),

  deleteColor: (id) =>
    set((state) => ({
      colors: state.colors.filter((c) => c.id !== id)
    })),

  toggleSize: (size) =>
    set((state) => ({
      sizes: state.sizes.map((s) => (s.size === size ? { ...s, isActive: !s.isActive } : s))
    })),

  addSize: (size) =>
    set((state) => ({
      sizes: state.sizes.some((s) => s.size === size)
        ? state.sizes
        : [...state.sizes, { size, isActive: true }]
    })),

  deleteSize: (size) =>
    set((state) => ({
      sizes: state.sizes.filter((s) => s.size !== size)
    })),

  addTopic: (name, description) =>
    set((state) => ({
      topics: [...state.topics, { id: `top-${Date.now()}`, name, description, isActive: true }]
    })),

  updateTopic: (id, name, description, isActive) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === id
          ? {
              ...t,
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(isActive !== undefined && { isActive })
            }
          : t
      )
    })),

  deleteTopic: (id) =>
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== id)
    })),

  addBank: (name, code, logoUrl) =>
    set((state) => ({
      banks: [...state.banks, { id: `bank-${Date.now()}`, name, code, logoUrl, isActive: true }]
    })),

  updateBank: (id, name, code, logoUrl, isActive) =>
    set((state) => ({
      banks: state.banks.map((b) =>
        b.id === id
          ? {
              ...b,
              ...(name !== undefined && { name }),
              ...(code !== undefined && { code }),
              ...(logoUrl !== undefined && { logoUrl }),
              ...(isActive !== undefined && { isActive })
            }
          : b
      )
    })),

  deleteBank: (id) =>
    set((state) => ({
      banks: state.banks.filter((b) => b.id !== id)
    }))
}));

// React Query hooks to fetch from API
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/categories');
      if (data.code === 200 && data.data) {
        return data.data as CategoryItem[];
      }
      return Array.isArray(data) ? data : [];
    },
    placeholderData: (previousData) => previousData
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
    },
    placeholderData: (previousData) => previousData
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
    },
    placeholderData: (previousData) => previousData
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
    },
    placeholderData: (previousData) => previousData
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
    },
    placeholderData: (previousData) => previousData
  });
}

export function useMaterialsQuery() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/materials');
      if (data.code === 200 && data.data) {
        return data.data as MaterialItem[];
      }
      return Array.isArray(data) ? data : [];
    },
    placeholderData: (previousData) => previousData
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
    mutationFn: async ({
      id,
      name,
      description,
      isActive
    }: {
      id: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.put(`/api/v1/categories/${id}`, { name, description, isActive });
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<CategoryItem[]>(['categories']);

      queryClient.setQueryData<CategoryItem[]>(['categories'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat));
      });

      return { previousCategories };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
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
    mutationFn: async ({
      id,
      name,
      hex,
      isActive
    }: {
      id: string;
      name?: string;
      hex?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.put(`/api/v1/colors/${id}`, { name, hex, isActive });
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['colors'] });
      const previousColors = queryClient.getQueryData<ColorItem[]>(['colors']);

      queryClient.setQueryData<ColorItem[]>(['colors'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((col) => (col.id === id ? { ...col, ...updates } : col));
      });

      return { previousColors };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousColors) {
        queryClient.setQueryData(['colors'], context.previousColors);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['colors'] })
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
    mutationFn: async ({
      id,
      name,
      description,
      isActive
    }: {
      id: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.put(`/api/v1/topics/${id}`, { name, description, isActive });
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['topics'] });
      const previousTopics = queryClient.getQueryData<TopicItem[]>(['topics']);

      queryClient.setQueryData<TopicItem[]>(['topics'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((top) => (top.id === id ? { ...top, ...updates } : top));
      });

      return { previousTopics };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTopics) {
        queryClient.setQueryData(['topics'], context.previousTopics);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['topics'] })
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
    onMutate: async ({ size, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['sizes'] });
      const previousSizes = queryClient.getQueryData<SizeItem[]>(['sizes']);

      queryClient.setQueryData<SizeItem[]>(['sizes'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((s) => (s.size === size ? { ...s, isActive } : s));
      });

      return { previousSizes };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSizes) {
        queryClient.setQueryData(['sizes'], context.previousSizes);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sizes'] })
  });

  const addSizeMutation = useMutation({
    mutationFn: async ({ size }: { size: string }) => {
      const { data } = await axios.post('/api/v1/sizes', { size });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sizes'] })
  });

  const deleteSizeMutation = useMutation({
    mutationFn: async (size: string) => {
      await axios.delete(`/api/v1/sizes/${encodeURIComponent(size)}`);
      return size;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sizes'] })
  });

  const addBankMutation = useMutation({
    mutationFn: async ({
      name,
      code,
      logoUrl,
      isActive
    }: {
      name: string;
      code?: string;
      logoUrl?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.post('/api/v1/banks', { name, code, logoUrl, isActive });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      code,
      logoUrl,
      isActive
    }: {
      id: string;
      name?: string;
      code?: string;
      logoUrl?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.put(`/api/v1/banks/${id}`, { name, code, logoUrl, isActive });
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['banks'] });
      const previousBanks = queryClient.getQueryData<BankItem[]>(['banks']);

      queryClient.setQueryData<BankItem[]>(['banks'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((b) => (b.id === id ? { ...b, ...updates } : b));
      });

      return { previousBanks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/banks/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banks'] })
  });

  const addMaterialMutation = useMutation({
    mutationFn: async ({
      type,
      name,
      description
    }: {
      type: 'FABRIC' | 'TREATMENT' | 'ORIGIN' | 'CARE';
      name: string;
      description?: string;
    }) => {
      const { data } = await axios.post('/api/v1/materials', { type, name, description });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] })
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      isActive
    }: {
      id: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const { data } = await axios.put('/api/v1/materials', { id, name, description, isActive });
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['materials'] });
      const previousMaterials = queryClient.getQueryData<MaterialItem[]>(['materials']);

      queryClient.setQueryData<MaterialItem[]>(['materials'], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((m) => (m.id === id ? { ...m, ...updates } : m));
      });

      return { previousMaterials };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMaterials) {
        queryClient.setQueryData(['materials'], context.previousMaterials);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['materials'] })
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/materials?id=${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] })
  });

  const isPending = [
    addCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
    addColorMutation,
    updateColorMutation,
    deleteColorMutation,
    addTopicMutation,
    updateTopicMutation,
    deleteTopicMutation,
    toggleSizeMutation,
    addSizeMutation,
    deleteSizeMutation,
    addBankMutation,
    updateBankMutation,
    deleteBankMutation,
    addMaterialMutation,
    updateMaterialMutation,
    deleteMaterialMutation
  ].some((mutation) => mutation.isPending);

  return {
    isPending,
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
    addSize: addSizeMutation.mutateAsync,
    deleteSize: deleteSizeMutation.mutateAsync,
    addBank: addBankMutation.mutateAsync,
    updateBank: updateBankMutation.mutateAsync,
    deleteBank: deleteBankMutation.mutateAsync,
    addMaterial: addMaterialMutation.mutateAsync,
    updateMaterial: updateMaterialMutation.mutateAsync,
    deleteMaterial: deleteMaterialMutation.mutateAsync
  };
}
