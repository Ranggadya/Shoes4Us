"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

export default function RegisterPage() {
  const { register, error, user, isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name || !email || !password) {
      setFormError("Semua field wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      await register({ name, email, password });
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal mendaftar. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoading && user) {
    return null;
  }

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-6"
      style={{ backgroundImage: "url('/sepatu12.jpeg')" }}
    >
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg bg-opacity-95">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Daftar</h2>
        <p className="text-gray-600 text-center mt-2">
          Buat akun baru untuk mulai belanja di Shoes4U
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            />
            <PasswordStrengthMeter password={password} showRequirements />
          </div>

          {(formError || error) && (
            <p className="text-sm text-red-600">
              {formError || error || "Terjadi kesalahan"}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-black font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
