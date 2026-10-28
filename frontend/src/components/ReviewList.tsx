import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Check, User } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface ReviewSummary {
  total: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewListProps {
  productId: string;
  refreshTrigger?: number;
}

export default function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId, refreshTrigger]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setReviews(data.data.reviews || []);
        setSummary(data.data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && summary.total > 0 && (
        <div className="bg-gray-50 p-6 rounded-xl flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="text-center md:text-left">
            <h3 className="text-4xl font-extrabold text-gray-900">
              {summary.averageRating.toFixed(1)}
            </h3>
            <div className="my-2">
              <StarRating rating={summary.averageRating} size="md" />
            </div>
            <p className="text-sm text-gray-500">
              Berdasarkan {summary.total} ulasan
            </p>
          </div>

          <div className="w-full max-w-xs space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as keyof typeof summary.distribution] || 0;
              const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-4">{star}★</span>
                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Belum ada review untuk produk ini. Jadilah yang pertama memberikan ulasan!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {review.user?.name || "Anonim"}
                    </p>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-600">
                        <Check size={12} /> Pembeli Terverifikasi
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </span>
              </div>

              <StarRating rating={review.rating} size="sm" />

              {review.title && (
                <p className="font-semibold text-sm text-gray-900 mt-2">
                  {review.title}
                </p>
              )}

              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
