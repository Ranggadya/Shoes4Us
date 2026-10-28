import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

export default function RegisterPage() {
  const { register, error, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [isLoading, user, navigate]);

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
      navigate("/");
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
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-6 py-12"
      style={{ backgroundImage: "url('/sepatu12.jpeg')" }}
    >
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl bg-opacity-95 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Daftar</h2>
        <p className="text-gray-600 text-center mt-2">
          Buat akun baru untuk mulai belanja di Shoes4Us
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {(formError || error) && (
            <p className="text-sm text-red-600">
              {formError || error || "Gagal mendaftar"}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-black py-2.5 font-medium text-white hover:bg-gray-800 transition disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Membuat akun..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-black hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </section>
  );
}
