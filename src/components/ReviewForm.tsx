"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import StarRating from "./StarRating";
import toast from "react-hot-toast";
import Link from "next/link";

interface ReviewFormProps {
  productId: number;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Silakan login untuk memberikan review");
      return;
    }

    if (rating === 0) {
      toast.error("Pilih rating bintang");
      return;
    }

    if (comment.length < 10) {
      toast.error("Review minimal 10 karakter");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          rating,
          title: title || undefined,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Gagal menambahkan review");
      }

      toast.success("Review berhasil ditambahkan!");
      setRating(0);
      setTitle("");
      setComment("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600 mb-4">
          Login untuk memberikan review produk ini
        </p>
        <Link
          href="/login"
          className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Tulis Review</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {rating === 5 && "Sempurna! ⭐"}
            {rating === 4 && "Sangat Baik! 😊"}
            {rating === 3 && "Cukup Baik 👍"}
            {rating === 2 && "Kurang Memuaskan 😐"}
            {rating === 1 && "Tidak Memuaskan 😞"}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Judul Review (Opsional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          placeholder="Ringkasan review Anda"
          maxLength={100}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Review <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          placeholder="Bagikan pengalaman Anda dengan produk ini..."
          rows={4}
          required
          minLength={10}
          maxLength={1000}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">
            Minimal 10 karakter
          </span>
          <span className={comment.length > 900 ? "text-red-500" : "text-gray-500"}>
            {comment.length}/1000 karakter
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isSubmitting ? "Mengirim Review..." : "Kirim Review"}
      </button>
    </form>
  );
}
