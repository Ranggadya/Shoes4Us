import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import AuthEditorialRail from "@/components/AuthEditorialRail";
import {
  AuthGoogleButton,
  AuthRedirectBanner,
} from "@/components/AuthFormPrimitives";
import {
  AUTH_FOCUS_RING,
  AUTH_MOBILE_ASSURANCE,
  getAuthInputClass,
  getAuthRedirectContext,
  sanitizeAuthRedirect,
} from "@/utils/auth-redirect";
import { validateEmailFormat } from "@/utils/auth-validation";

type ErrorTarget = "email" | "password" | "both" | null;

export default function LoginPage() {
  const { login, error, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const safeRedirect = sanitizeAuthRedirect(searchParams.get("redirect"));
  const isSubmittingRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorTarget, setErrorTarget] = useState<ErrorTarget>(null);
  const [showContextError, setShowContextError] = useState(false);

  const redirectContext = getAuthRedirectContext(safeRedirect, "login");
  const activeError = formError || (showContextError ? error : null);
  const isEmailInvalid =
    Boolean(activeError) &&
    (errorTarget === "email" || errorTarget === "both");
  const isPasswordInvalid =
    Boolean(activeError) &&
    (errorTarget === "password" || errorTarget === "both");

  const registerHref =
    safeRedirect !== "/"
      ? `/register?redirect=${encodeURIComponent(safeRedirect)}`
      : "/register";

  const clearValidationState = () => {
    if (formError) setFormError(null);
    if (errorTarget) setErrorTarget(null);
    if (showContextError) setShowContextError(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    setFormError(null);
    setErrorTarget(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail && !password) {
      setFormError("Email dan password wajib diisi.");
      setErrorTarget("both");
      return;
    }

    if (!normalizedEmail) {
      setFormError("Email dan password wajib diisi.");
      setErrorTarget("email");
      return;
    }

    const emailFormatError = validateEmailFormat(normalizedEmail, {
      invalidMessage:
        "Masukkan alamat email yang valid (contoh: nama@email.com).",
    });
    if (emailFormatError) {
      setFormError(emailFormatError);
      setErrorTarget("email");
      return;
    }

    if (!password) {
      setFormError("Email dan password wajib diisi.");
      setErrorTarget("password");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      setShowContextError(true);
      await login({ email: normalizedEmail, password });
      hasNavigatedRef.current = true;
      navigate(safeRedirect, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal login. Coba lagi.");
      }
      setErrorTarget("both");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigate(safeRedirect, { replace: true });
    }
  }, [isLoading, user, navigate, safeRedirect]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[calc(100vh-65px)] lg:min-h-screen bg-white text-neutral-950 flex items-center justify-center px-6"
      >
        <div className="inline-flex items-center gap-3 text-sm font-medium text-neutral-700">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Memverifikasi sesi Anda...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-65px)] lg:min-h-screen bg-white text-neutral-950 selection:bg-black selection:text-white lg:grid lg:grid-cols-[420px_1fr] xl:grid-cols-[440px_1fr]">
      <SEO
        title="Login"
        description="Masuk ke akun Shoes4Us untuk menyinkronkan keranjang belanja, melihat wishlist, dan melacak pesanan Anda."
      />

      <AuthEditorialRail
        heading="Satu Pintu untuk Koleksi & Pesanan Anda."
        description="Masuk untuk menyinkronkan keranjang belanja secara otomatis, melanjutkan pengiriman, dan memantau riwayat pesanan sepatu orisinal Anda."
        imageSrc="/NB%201000%20WHITE.webp"
        imageAlt="Sneaker New Balance 1000 koleksi Shoes4Us"
        fallbackSrc="/sepatu1.jpeg"
        imageMode="contain"
        captionLeft="Kurasi Ritel Resmi"
        captionRight="Ukuran US & EU"
      />

      {/* Main Authentication Form Stage */}
      <section className="flex flex-col min-w-0 bg-white">
        <div className="hidden lg:flex items-center justify-end gap-3 px-10 xl:px-14 pt-10 xl:pt-12">
          <span className="text-sm text-neutral-600">Butuh akun baru?</span>
          <Link
            to={registerHref}
            className={`min-h-[44px] inline-flex items-center px-1 text-xs font-bold uppercase tracking-[0.08em] text-black underline underline-offset-4 hover:text-neutral-700 ${AUTH_FOCUS_RING}`}
          >
            Daftar Sekarang
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pt-6 pb-20 lg:py-6">
          <div className="w-full max-w-[440px]">
            <header className="mb-5">
              <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight leading-tight text-neutral-950">
                Masuk ke Shoes4Us
              </h1>
              <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
                Gunakan email dan password terdaftar untuk akun pembeli maupun
                pengelola toko.
              </p>
            </header>

            <AuthRedirectBanner context={redirectContext} />

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-800 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  disabled={submitting}
                  aria-invalid={isEmailInvalid}
                  aria-describedby={
                    isEmailInvalid ? "login-form-error" : undefined
                  }
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearValidationState();
                  }}
                  className={getAuthInputClass(isEmailInvalid)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-800"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className={`min-h-[44px] -my-3 px-1 inline-flex items-center text-xs font-semibold text-neutral-700 hover:text-black underline underline-offset-4 ${AUTH_FOCUS_RING}`}
                  >
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    value={password}
                    disabled={submitting}
                    aria-invalid={isPasswordInvalid}
                    aria-describedby={
                      isPasswordInvalid ? "login-form-error" : undefined
                    }
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearValidationState();
                    }}
                    className={getAuthInputClass(isPasswordInvalid, "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={submitting}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-0 inset-y-0 min-w-[44px] min-h-[44px] px-3 inline-flex items-center justify-center text-neutral-600 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset disabled:opacity-40"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {activeError && (
                <div
                  id="login-form-error"
                  role="alert"
                  aria-live="assertive"
                  className="border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-900 flex items-start gap-2.5"
                >
                  <AlertCircle
                    className="w-4 h-4 mt-0.5 shrink-0 text-red-700"
                    aria-hidden="true"
                  />
                  <span>{activeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className={`w-full min-h-[48px] px-5 py-3 bg-black text-white text-xs font-bold uppercase tracking-[0.1em] hover:bg-neutral-800 active:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 ${AUTH_FOCUS_RING}`}
              >
                {submitting && (
                  <Loader2
                    className="w-4 h-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                <span>{submitting ? "Memproses..." : "Login"}</span>
              </button>
            </form>

            <div className="flex items-center gap-3 my-5" aria-hidden="true">
              <div className="flex-grow border-t border-neutral-200" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                atau
              </span>
              <div className="flex-grow border-t border-neutral-200" />
            </div>

            <AuthGoogleButton
              label="Login dengan Google"
              disabled={submitting}
            />

            <p className="mt-5 text-center text-sm text-neutral-600">
              Belum punya akun?{" "}
              <Link
                to={registerHref}
                className={`font-bold text-black underline underline-offset-4 hover:text-neutral-700 ${AUTH_FOCUS_RING}`}
              >
                Daftar
              </Link>
            </p>

            <p className="lg:hidden mt-6 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-600 tabular-nums">
              {AUTH_MOBILE_ASSURANCE}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
