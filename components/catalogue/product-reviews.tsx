'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, CheckCircle2, MessageSquare, Plus, Loader2, X, Send } from 'lucide-react';
import { StarRating } from '@/components/catalogue/star-rating';
import { useCustomerStore } from '@/lib/customer-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productSlug: string;
  productName: string;
}

export function ProductReviews({ productSlug, productName }: ProductReviewsProps) {
  const { customer, isAuthenticated } = useCustomerStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null); // null = all

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formName, setFormName] = useState(customer?.fullName || '');
  const [formEmail, setFormEmail] = useState(customer?.email || '');
  const [formComment, setFormComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      if (customer.fullName) setFormName(customer.fullName);
      if (customer.email) setFormEmail(customer.email);
    }
  }, [customer]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/products/${productSlug}/reviews`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setReviews(json.data.reviews || []);
        setAverageRating(json.data.averageRating || 0);
        setTotalReviews(json.data.totalReviews || 0);
        setRatingDistribution(json.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch {
      console.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Masukkan nama Anda.');
      return;
    }
    if (!formComment.trim()) {
      toast.error('Tuliskan ulasan Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formName.trim(),
          customerEmail: formEmail.trim() || undefined,
          rating: formRating,
          comment: formComment.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Gagal mengirim ulasan.');
      }

      toast.success('Ulasan Anda berhasil dikirim! Terima kasih.');
      setFormComment('');
      setIsFormOpen(false);
      loadReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = selectedFilter
    ? reviews.filter((r) => r.rating === selectedFilter)
    : reviews;

  return (
    <section className="mt-16 md:mt-24 pt-12 border-t border-(--cat-stone)" aria-label="Ulasan Pelanggan">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 gap-4">
        <div>
          <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
            Customer Feedback
          </span>
          <h2 className="font-eb-garamond text-[28px] md:text-[34px] text-(--cat-on-surface) font-normal">
            Ulasan & Rating Produk
          </h2>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity cursor-pointer w-fit"
        >
          <Plus size={14} /> Tulis Ulasan
        </button>
      </div>

      {/* Review Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-(--cat-surface) border border-(--cat-stone) p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-(--cat-stone)">
              <h3 className="font-eb-garamond text-[22px] text-(--cat-on-surface)">
                Tulis Ulasan untuk {productName}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-2">
                  Rating Bintang
                </label>
                <div className="flex items-center gap-3">
                  <StarRating
                    rating={formRating}
                    size={24}
                    interactive
                    onChange={(r) => setFormRating(r)}
                  />
                  <span className="font-hanken text-[14px] font-medium text-(--cat-on-surface)">
                    {formRating} dari 5 Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Nama Anda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface-container-low) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Email (Opsional, untuk verifikasi pembeli)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface-container-low) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                  Ulasan & Pengalaman Pemakaian <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Ceritakan tentang kenyamanan bahan, fitting ukuran, dan kualitas jahitan..."
                  className="w-full p-3 font-hanken text-[14px] bg-(--cat-surface-container-low) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--cat-stone)">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-(--cat-stone) font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity cursor-pointer',
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Kirim Ulasan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6 bg-(--cat-surface-container-low) border border-(--cat-stone) p-6 md:p-8">
        {/* Left: Overall Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-(--cat-stone) pb-6 md:pb-0 md:pr-6">
          <div className="font-eb-garamond text-[54px] font-normal leading-none text-(--cat-on-surface) tabular-nums">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="mt-2">
            <StarRating rating={averageRating} size={18} />
          </div>
          <p className="mt-2 font-hanken text-[13px] text-(--cat-on-surface-variant)">
            Berdasarkan {totalReviews} ulasan pembeli
          </p>
        </div>

        {/* Right: Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <button
                key={stars}
                onClick={() => setSelectedFilter(selectedFilter === stars ? null : stars)}
                className={cn(
                  'flex items-center gap-3 w-full group transition-opacity cursor-pointer text-left',
                  selectedFilter && selectedFilter !== stars ? 'opacity-40' : 'opacity-100'
                )}
              >
                <span className="font-hanken text-[12px] font-medium text-(--cat-on-surface) w-14 shrink-0 flex items-center gap-1">
                  {stars} <Star size={12} className="fill-amber-400 text-amber-400" />
                </span>

                {/* Progress bar */}
                <div className="flex-1 h-2 bg-(--cat-stone)/40 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="font-hanken text-[12px] text-(--cat-on-surface-variant) w-12 text-right shrink-0 tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      {totalReviews > 0 && (
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedFilter(null)}
            className={cn(
              'px-3.5 py-1.5 font-hanken text-[11px] uppercase tracking-[0.08em] border transition-colors cursor-pointer shrink-0',
              selectedFilter === null
                ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                : 'border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal)'
            )}
          >
            Semua ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setSelectedFilter(stars)}
              className={cn(
                'px-3.5 py-1.5 font-hanken text-[11px] uppercase tracking-[0.08em] border transition-colors cursor-pointer shrink-0 flex items-center gap-1',
                selectedFilter === stars
                  ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                  : 'border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal)'
              )}
            >
              <span>{stars}</span>
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>({ratingDistribution[stars] || 0})</span>
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin mx-auto text-(--cat-on-surface)" size={20} />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-(--cat-stone) p-6">
            <MessageSquare className="mx-auto text-(--cat-on-surface-variant) mb-2" size={28} />
            <p className="font-eb-garamond text-[18px] text-(--cat-on-surface)">
              {totalReviews === 0
                ? 'Belum ada ulasan untuk produk ini.'
                : `Tidak ada ulasan dengan rating ${selectedFilter} bintang.`}
            </p>
            <p className="font-hanken text-[13px] text-(--cat-on-surface-variant) mt-1">
              Jadilah yang pertama membagikan ulasan Anda untuk produk ini!
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-6 bg-(--cat-surface-container-low) border border-(--cat-stone) space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-hanken text-[14px] font-semibold text-(--cat-on-surface)">
                      {review.customerName}
                    </span>
                    {review.isVerifiedBuyer && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-hanken text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Pembeli Terverifikasi
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <StarRating rating={review.rating} size={14} />
                  </div>
                </div>

                <span className="font-hanken text-[12px] text-(--cat-on-surface-variant) shrink-0">
                  {new Date(review.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <p className="font-hanken text-[14px] leading-relaxed text-(--cat-on-surface)">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
