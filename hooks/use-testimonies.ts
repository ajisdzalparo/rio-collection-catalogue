'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Testimony } from '@/types/catalogue.types';
import { getTestimonies } from '@/lib/api';

export function useTestimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTestimonies()
      .then((data) => {
        if (data && data.length > 0) {
          const formatted = data.map((item, index) => ({
            ...item,
            clientName: item.clientName || item.alt || `Pelanggan Testimoni ${index + 1}`,
            status: item.status || 'ACTIVE',
            createdAt: item.createdAt || '2026-08-01'
          }));
          setTestimonies(formatted);
        }
      })
      .catch((err) => console.error('Failed to fetch testimonies from VeloMock:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const addTestimony = useCallback((item: Omit<Testimony, 'id' | 'createdAt'>) => {
    const newTestimony: Testimony = {
      ...item,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTestimonies((prev) => [newTestimony, ...prev]);
  }, []);

  const updateTestimony = useCallback((id: string, updates: Partial<Testimony>) => {
    setTestimonies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTestimony = useCallback((id: string) => {
    setTestimonies((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTestimonyStatus = useCallback((id: string) => {
    setTestimonies((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' } : t
      )
    );
  }, []);

  return {
    data: testimonies,
    isLoading,
    addTestimony,
    updateTestimony,
    deleteTestimony,
    toggleTestimonyStatus
  };
}
