"use client";

import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Check, User } from "lucide-react";

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    id: number;
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

      if (data.success) {
        setReviews(data.data.reviews);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="text-gray-600 mt-2">Memuat reviews...</p>
      </div>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-lg font-medium">Belum Ada Review</p>
        <p className="text-gray-500 text-sm mt-1">
          Jadilah yang pertama memberikan review untuk produk ini!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-100">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              {summary.averageRating}
            </div>
            <StarRating rating={summary.averageRating} size="md" />
            <div className="text-sm text-gray-600 mt-2 font-medium">
              {summary.total} {summary.total === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as keyof typeof summary.distribution];
              const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium w-8">{star}★</span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Semua Reviews ({summary.total})
        </h3>

        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b last:border-0 pb-6 last:pb-0"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-gray-500" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {review.user.name}
                  </span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <Check className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </span>
                </div>

                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">
                    {review.title}
                  </h4>
                )}

                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
