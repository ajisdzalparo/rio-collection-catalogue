'use client';

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCustomerStore } from '@/lib/customer-store';
import { toast } from 'sonner';

export interface ProductReview {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  comment: string;
  mediaUrls?: string[];
  isVerifiedBuyer: boolean;
  createdAt: string;
}

export interface ProductReviewsData {
  product?: { id: string; name: string };
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  reviews: ProductReview[];
}

const DEFAULT_REVIEW_DATA: ProductReviewsData = {
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  reviews: []
};

async function fetchProductReviews(productSlug: string): Promise<ProductReviewsData> {
  if (!productSlug) return DEFAULT_REVIEW_DATA;
  try {
    const { data } = await axios.get(`/api/v1/products/${productSlug}/reviews`);
    if (data?.status === 'success' && data?.data) {
      return data.data as ProductReviewsData;
    }
    return DEFAULT_REVIEW_DATA;
  } catch (error) {
    console.error('Error fetching product reviews with axios:', error);
    return DEFAULT_REVIEW_DATA;
  }
}

export function useProductReviews(productSlug: string) {
  const queryClient = useQueryClient();
  const { customer, isAuthenticated, token } = useCustomerStore();

  const query = useQuery({
    queryKey: ['reviews', productSlug],
    queryFn: () => fetchProductReviews(productSlug),
    enabled: Boolean(productSlug),
    staleTime: 60_000
  });

  const reviewData = query.data ?? DEFAULT_REVIEW_DATA;
  const reviews = reviewData.reviews ?? [];
  const averageRating = reviewData.averageRating ?? 0;
  const totalReviews = reviewData.totalReviews ?? 0;
  const ratingDistribution = reviewData.ratingDistribution ?? DEFAULT_REVIEW_DATA.ratingDistribution;

  const hasUserReviewed = Boolean(
    customer &&
      reviews.some(
        (r) =>
          (customer.email && r.customerEmail?.toLowerCase() === customer.email.toLowerCase()) ||
          r.customerName.toLowerCase() === (customer.fullName || '').toLowerCase()
      )
  );

  const mutation = useMutation({
    mutationFn: async ({
      rating,
      comment,
      mediaUrls = []
    }: {
      rating: number;
      comment: string;
      mediaUrls?: string[];
    }) => {
      const { data } = await axios.post(
        `/api/v1/products/${productSlug}/reviews`,
        { rating, comment, mediaUrls },
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      if (data?.status !== 'success') {
        throw new Error(data?.message || 'Gagal mengirim ulasan.');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Terima kasih! Ulasan Anda telah berhasil disimpan.');
      void queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : 'Gagal mengirim ulasan.';
      toast.error(errorMessage);
    }
  });

  return {
    reviewData,
    reviews,
    averageRating,
    totalReviews,
    ratingDistribution,
    hasUserReviewed,
    isAuthenticated,
    customer,
    token,
    isLoading: query.isLoading,
    isError: query.isError,
    submitReview: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    refetch: query.refetch
  };
}
