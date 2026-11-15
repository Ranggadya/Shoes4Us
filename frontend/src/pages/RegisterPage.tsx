import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import AuthEditorialRail from "@/components/AuthEditorialRail";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
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
import {
  validateEmailFormat,
  validateNameField,
  validatePasswordField,
} from "@/utils/auth-validation";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function inferServerErrorField(message: string): keyof FieldErrors | null {
  const normalized = message.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("password")) return "password";
  if (normalized.includes("nama")) return "name";
  return null;
}

function FieldErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 text-xs font-medium text-red-700 flex items-start gap-1.5"
    >
      <AlertCircle
        className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-600"
        aria-hidden="true"
      />
      <span>{message}</span>
    </p>
  );
}

export default function RegisterPage() {
  const { register, error, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const safeRedirect = sanitizeAuthRedirect(searchParams.get("redirect"));
  const isSubmittingRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showContextError, setShowContextError] = useState(false);

  const redirectContext = getAuthRedirectContext(safeRedirect, "register");
  const hasMappedFieldError = Boolean(
    fieldErrors.name || fieldErrors.email || fieldErrors.password
  );
  const activeFormError =
    formError || (showContextError && !hasMappedFieldError ? error : null);

  const isNameInvalid = Boolean(fieldErrors.name);
  const isEmailInvalid = Boolean(fieldErrors.email);
  const isPasswordInvalid = Boolean(fieldErrors.password);

  const loginHref =
    safeRedirect !== "/"
      ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
      : "/login";

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formError) setFormError(null);
    if (showContextError) setShowContextError(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    setFieldErrors({});
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextErrors: FieldErrors = {};

    const nameError = validateNameField(name);
    if (nameError) {
      nextErrors.name = nameError;
    }

    const emailError = validateEmailFormat(email, {
      requiredMessage:
        "Masukkan alamat email yang valid (contoh: nama@email.com).",
      invalidMessage:
        "Masukkan alamat email yang valid (contoh: nama@email.com).",
    });
    if (emailError) {
      nextErrors.email = emailError;
    }

    const passwordError = validatePasswordField(password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      setShowContextError(true);
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      hasNavigatedRef.current = true;
      navigate(safeRedirect, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi.";
      const mappedField = inferServerErrorField(message);
      if (mappedField) {
        setFieldErrors({ [mappedField]: message });
      } else {
        setFormError(message);
      }
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
        title="Daftar"
        description="Buat akun Shoes4Us untuk menyinkronkan keranjang belanja, menyimpan wishlist, dan melacak pesanan Anda."
      />

      <AuthEditorialRail
        heading="Bergabung & Mulai Koleksi Anda."
        description="Buat akun untuk menyinkronkan keranjang belanja tamu secara otomatis, menyimpan ukuran favorit, dan memantau pesanan resmi Anda."
        imageSrc="/sepatu8.jpeg"
        imageAlt="Flat-lay koleksi sneaker ritel Shoes4Us di studio"
        fallbackSrc="/NB%201000%20WHITE.webp"
        imageMode="cover"
        captionLeft="Koleksi Ritel Resmi"
        captionRight="Ukuran US & EU"
      />

      {/* Main Registration Form Stage */}
      <section className="flex flex-col min-w-0 bg-white">
        <div className="hidden lg:flex items-center justify-end gap-3 px-10 xl:px-14 pt-10 xl:pt-12">
          <span className="text-sm text-neutral-600">Sudah punya akun?</span>
          <Link
            to={loginHref}
            className={`min-h-[44px] inline-flex items-center px-1 text-xs font-bold uppercase tracking-[0.08em] text-black underline underline-offset-4 hover:text-neutral-700 ${AUTH_FOCUS_RING}`}
          >
            Login Sekarang
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pt-6 pb-20 lg:py-6">
          <div className="w-full max-w-[440px]">
            <header className="mb-5">
              <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight leading-tight text-neutral-950">
                Buat Akun Shoes4Us
              </h1>
              <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
                Isi data singkat di bawah untuk menyinkronkan keranjang belanja
                dan mempercepat checkout.
              </p>
            </header>

            <AuthRedirectBanner context={redirectContext} />

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-800 mb-1.5"
                >
                  Nama Lengkap
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  disabled={submitting}
                  aria-invalid={isNameInvalid}
                  aria-describedby={
                    isNameInvalid ? "register-name-error" : undefined
                  }
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  className={getAuthInputClass(isNameInvalid)}
                />
                <FieldErrorMessage
                  id="register-name-error"
                  message={fieldErrors.name}
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-800 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  disabled={submitting}
                  aria-invalid={isEmailInvalid}
                  aria-describedby={
                    isEmailInvalid ? "register-email-error" : undefined
                  }
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  className={getAuthInputClass(isEmailInvalid)}
                />
                <FieldErrorMessage
                  id="register-email-error"
                  message={fieldErrors.email}
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-bold uppercase tracking-[0.08em] text-neutral-800 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    disabled={submitting}
                    aria-invalid={isPasswordInvalid}
                    aria-describedby={
                      [
                        isPasswordInvalid ? "register-password-error" : "",
                        "register-password-hint",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
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

                <FieldErrorMessage
                  id="register-password-error"
                  message={fieldErrors.password}
                />

                <p
                  id="register-password-hint"
                  className="mt-1.5 text-xs text-neutral-600"
                >
                  Wajib minimal 8 karakter.
                </p>

                <PasswordStrengthMeter
                  password={password}
                  guidanceLabel="Rekomendasi keamanan tambahan (opsional)"
                />
              </div>

              {activeFormError && (
                <div
                  id="register-form-error"
                  role="alert"
                  aria-live="assertive"
                  className="border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-900 flex items-start gap-2.5"
                >
                  <AlertCircle
                    className="w-4 h-4 mt-0.5 shrink-0 text-red-700"
                    aria-hidden="true"
                  />
                  <span>{activeFormError}</span>
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
                <span>{submitting ? "Membuat akun..." : "Daftar"}</span>
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
              label="Daftar dengan Google"
              disabled={submitting}
            />

            <p className="mt-5 text-center text-sm text-neutral-600">
              Sudah punya akun?{" "}
              <Link
                to={loginHref}
                className={`font-bold text-black underline underline-offset-4 hover:text-neutral-700 ${AUTH_FOCUS_RING}`}
              >
                Login di sini
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
