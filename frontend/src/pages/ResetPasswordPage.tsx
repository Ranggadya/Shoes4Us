import { useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { api } from "@/services/api";

export default function ResetPasswordPage() {
  const { token: paramToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token reset password tidak ditemukan atau tidak valid");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.post<{ message?: string }>("/auth/reset-password", {
        token,
        password,
        newPassword: password,
      });

      toast.success(data.message || "Password berhasil direset!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm">
            Masukkan password baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-black hover:underline"
          >
            ← Kembali ke halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
