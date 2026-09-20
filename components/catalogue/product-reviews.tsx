'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  CheckCircle2,
  MessageSquare,
  Plus,
  Loader2,
  X,
  Send,
  Lock,
  User,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Film
} from 'lucide-react';
import { StarRating } from '@/components/catalogue/star-rating';
import { useProductReviews } from '@/hooks/use-product-reviews';
import { uploadFileWithPresign } from '@/lib/presigned-upload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productSlug: string;
  productName: string;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i) !== null ||
    url.includes('video/')
  );
}

export function ProductReviews({ productSlug, productName }: ProductReviewsProps) {
  const {
    reviews,
    averageRating,
    totalReviews,
    ratingDistribution,
    hasUserReviewed,
    isAuthenticated,
    customer,
    token,
    isLoading,
    submitReview,
    isSubmitting
  } = useProductReviews(productSlug);

  const [selectedFilter, setSelectedFilter] = useState<number | 'media' | null>(null); // null = all, number = stars, 'media' = with media
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formMediaUrls, setFormMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Lightbox Modal state
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    isVideo: boolean;
    customerName?: string;
  } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const currentPhotos = formMediaUrls.filter((url) => !isVideoUrl(url));
  const currentVideos = formMediaUrls.filter((url) => isVideoUrl(url));

  const handleOpenForm = () => {
    if (!isAuthenticated || !customer) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (hasUserReviewed) {
      toast.info('Anda sudah memberikan ulasan untuk produk ini.');
      return;
    }

    setIsFormOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = Math.max(0, 4 - currentPhotos.length);
    if (remainingSlots <= 0) {
      toast.error('Maksimal 4 foto per ulasan.');
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    setIsUploadingMedia(true);

    try {
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" bukan file gambar yang valid.`);
          continue;
        }
        if (file.size > 3 * 1024 * 1024) {
          toast.error(`Ukuran foto "${file.name}" melebihi batas maksimal 3 MB.`);
          continue;
        }

        const publicUrl = await uploadFileWithPresign(file, {
          purpose: 'review-media',
          token: token || undefined
        });

        setFormMediaUrls((prev) => [...prev, publicUrl]);
      }
      toast.success('Foto ulasan berhasil diunggah.');
    } catch (err) {
      console.error('Error uploading review photo:', err);
      toast.error('Gagal mengunggah foto ulasan.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentVideos.length >= 1) {
      toast.error('Maksimal 1 video ulasan per ulasan.');
      e.target.value = '';
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      toast.error('File harus berupa video (MP4, WEBM, MOV).');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Ukuran video (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 10 MB.`);
      e.target.value = '';
      return;
    }

    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadFileWithPresign(file, {
        purpose: 'review-media',
        token: token || undefined
      });

      setFormMediaUrls((prev) => [...prev, publicUrl]);
      toast.success('Video ulasan berhasil diunggah.');
    } catch (err) {
      console.error('Error uploading review video:', err);
      toast.error('Gagal mengunggah video ulasan.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setFormMediaUrls((prev) => prev.filter((u) => u !== urlToRemove));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) {
      toast.error('Tuliskan ulasan Anda.');
      return;
    }

    try {
      await submitReview({
        rating: formRating,
        comment: formComment.trim(),
        mediaUrls: formMediaUrls
      });
      setFormComment('');
      setFormMediaUrls([]);
      setIsFormOpen(false);
    } catch {
      // Error toast already handled by hook
    }
  };

  const mediaReviewsCount = reviews.filter((r) => Array.isArray(r.mediaUrls) && r.mediaUrls.length > 0).length;

  const filteredReviews = selectedFilter === 'media'
    ? reviews.filter((r) => Array.isArray(r.mediaUrls) && r.mediaUrls.length > 0)
    : selectedFilter !== null
      ? reviews.filter((r) => r.rating === selectedFilter)
      : reviews;

  return (
    <section className="mt-16 md:mt-24 pt-12 border-t border-(--cat-stone)" aria-label="Ulasan Pelanggan">
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleVideoUpload}
      />

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

        {hasUserReviewed ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-hanken text-[12px] font-medium">
            <CheckCircle2 size={15} /> Anda telah mengulas produk ini
          </div>
        ) : (
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity cursor-pointer w-fit"
          >
            <Plus size={14} /> Tulis Ulasan
          </button>
        )}
      </div>

      {/* Login Prompt Modal (if unauthenticated) */}
      {isLoginPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-(--cat-surface) border border-(--cat-stone) p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-(--cat-stone)">
              <div className="flex items-center gap-2 text-(--cat-on-surface)">
                <Lock size={18} />
                <h3 className="font-eb-garamond text-[22px]">Masuk ke Akun Diperlukan</h3>
              </div>
              <button
                onClick={() => setIsLoginPromptOpen(false)}
                className="p-1 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 font-hanken text-[14px] leading-relaxed text-(--cat-on-surface-variant)">
              Untuk memberikan ulasan, foto, dan video produk, Anda harus masuk ke akun pelanggan terlebih dahulu agar ulasan terverifikasi dan bebas dari spam.
            </p>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-(--cat-stone)">
              <button
                type="button"
                onClick={() => setIsLoginPromptOpen(false)}
                className="px-5 py-2.5 border border-(--cat-stone) font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
              >
                Batal
              </button>
              <Link
                href="/customer/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity cursor-pointer"
              >
                <User size={14} /> Masuk Akun
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal Form */}
      {isFormOpen && customer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-(--cat-surface) border border-(--cat-stone) p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
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

            {/* Customer identity banner */}
            <div className="mt-4 p-3 bg-(--cat-surface-container-low) border border-(--cat-stone) flex items-center gap-3">
              <User size={16} className="text-(--cat-on-surface-variant) shrink-0" />
              <div className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
                Mengulas sebagai:{' '}
                <strong className="text-(--cat-on-surface)">
                  {customer.fullName || customer.email.split('@')[0]}
                </strong>{' '}
                ({customer.email})
              </div>
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

              {/* Photo & Video Attachments Section */}
              <div className="space-y-2 pt-2 border-t border-(--cat-stone)">
                <div className="flex items-center justify-between">
                  <label className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)">
                    Foto & Video Produk (Opsional)
                  </label>
                  <span className="text-[11px] font-hanken text-(--cat-on-surface-variant)">
                    {currentPhotos.length}/4 Foto • {currentVideos.length}/1 Video
                  </span>
                </div>

                {/* Media Previews */}
                {formMediaUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5 py-1">
                    {formMediaUrls.map((url, idx) => {
                      const isVid = isVideoUrl(url);
                      return (
                        <div
                          key={`${url}-${idx}`}
                          className="relative aspect-square rounded-md overflow-hidden bg-black/10 border border-(--cat-stone) group"
                        >
                          {isVid ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white">
                              <VideoIcon size={20} className="text-primary mb-1" />
                              <span className="text-[9px] font-bold">Video</span>
                            </div>
                          ) : (
                            <Image
                              src={url}
                              alt="Review attachment preview"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(url)}
                            className="absolute top-1 right-1 p-1 bg-black/75 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer z-10"
                            title="Hapus media ini"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {currentPhotos.length < 4 && (
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-(--cat-stone) hover:border-(--cat-charcoal) bg-(--cat-surface-container-low) text-(--cat-on-surface) font-hanken text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <ImageIcon size={14} className="text-(--cat-on-surface-variant)" />
                      <span>Tambah Foto (Maks 3MB)</span>
                    </button>
                  )}

                  {currentVideos.length < 1 && (
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => videoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-(--cat-stone) hover:border-(--cat-charcoal) bg-(--cat-surface-container-low) text-(--cat-on-surface) font-hanken text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <VideoIcon size={14} className="text-(--cat-on-surface-variant)" />
                      <span>Tambah Video (Maks 10MB)</span>
                    </button>
                  )}

                  {isUploadingMedia && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-hanken text-(--cat-on-surface-variant) animate-pulse">
                      <Loader2 size={13} className="animate-spin" /> Mengunggah media...
                    </span>
                  )}
                </div>
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
                  disabled={isSubmitting || isUploadingMedia}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity cursor-pointer',
                    isSubmitting || isUploadingMedia ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
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

          {mediaReviewsCount > 0 && (
            <button
              onClick={() => setSelectedFilter(selectedFilter === 'media' ? null : 'media')}
              className={cn(
                'px-3.5 py-1.5 font-hanken text-[11px] uppercase tracking-[0.08em] border transition-colors cursor-pointer shrink-0 flex items-center gap-1.5',
                selectedFilter === 'media'
                  ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                  : 'border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal)'
              )}
            >
              <Film size={12} />
              <span>Dengan Foto & Video ({mediaReviewsCount})</span>
            </button>
          )}

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
                : selectedFilter === 'media'
                  ? 'Belum ada ulasan dengan foto atau video.'
                  : `Tidak ada ulasan dengan rating ${selectedFilter} bintang.`}
            </p>
            <p className="font-hanken text-[13px] text-(--cat-on-surface-variant) mt-1">
              Jadilah yang pertama membagikan ulasan Anda untuk produk ini!
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const hasMedia = Array.isArray(review.mediaUrls) && review.mediaUrls.length > 0;

            return (
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

                {/* Review Photos & Video Gallery */}
                {hasMedia && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {review.mediaUrls?.map((mediaUrl, mIdx) => {
                      const isVid = isVideoUrl(mediaUrl);

                      if (isVid) {
                        return (
                          <button
                            key={`${mediaUrl}-${mIdx}`}
                            type="button"
                            onClick={() =>
                              setLightboxMedia({
                                url: mediaUrl,
                                isVideo: true,
                                customerName: review.customerName
                              })
                            }
                            className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-black/90 border border-(--cat-stone) hover:border-(--cat-charcoal) group transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                            title="Klik untuk memutar video ulasan"
                          >
                            <video
                              src={mediaUrl}
                              preload="none"
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <div className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md">
                                <Play size={14} className="fill-black ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/75 text-white text-[9px] font-bold rounded">
                              Video
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={`${mediaUrl}-${mIdx}`}
                          type="button"
                          onClick={() =>
                            setLightboxMedia({
                              url: mediaUrl,
                              isVideo: false,
                              customerName: review.customerName
                            })
                          }
                          className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted/20 border border-(--cat-stone) hover:border-(--cat-charcoal) group transition-all cursor-pointer shrink-0 shadow-xs"
                          title="Klik untuk memperbesar foto ulasan"
                        >
                          <Image
                            src={mediaUrl}
                            alt={`Review photo by ${review.customerName}`}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute -top-10 right-0 md:-right-10 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors cursor-pointer z-10"
              title="Tutup (ESC)"
            >
              <X size={22} />
            </button>

            {lightboxMedia.isVideo ? (
              <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[80vh] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="relative max-w-3xl max-h-[85vh] w-auto h-auto rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src={lightboxMedia.url}
                  alt={`Review media from ${lightboxMedia.customerName || 'customer'}`}
                  width={1200}
                  height={1200}
                  unoptimized
                  className="max-h-[85vh] w-auto object-contain select-none"
                />
              </div>
            )}

            {lightboxMedia.customerName && (
              <div className="mt-3 text-center text-white/80 font-hanken text-xs">
                Ulasan oleh <span className="font-semibold text-white">{lightboxMedia.customerName}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
