 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login, error, isLoading, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Email dan password wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal login. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (!isLoading && user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/sepatu12.jpeg')" }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Login
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Masuk untuk melanjutkan ke Shoes4Us
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-black hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {(formError || error) && (
            <p className="text-sm text-red-600">
              {formError || error || "Terjadi kesalahan"}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-2 text-sm text-gray-500">atau</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 hover:bg-gray-100 transition"
          onClick={() => toast("Integrasi Google OAuth belum tersedia.", { icon: 'ℹ️' })}
        >
          <FcGoogle className="mr-2 text-xl" />
          <span className="font-medium text-gray-700">Login dengan Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-black font-semibold hover:underline"
          >
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
