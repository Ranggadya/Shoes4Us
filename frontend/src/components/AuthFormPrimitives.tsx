import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { ArrowRight, Info } from "lucide-react";
import { AUTH_FOCUS_RING } from "@/utils/auth-redirect";

interface AuthRedirectBannerProps {
  context: {
    title: string;
    description: string;
  } | null;
}

/** Contextual banner explaining redirect destination and automatic guest-cart sync. */
export function AuthRedirectBanner({ context }: AuthRedirectBannerProps) {
  if (!context) return null;

  return (
    <div
      data-testid="redirect-context-banner"
      className="mb-5 border border-neutral-900 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 flex items-start gap-3"
    >
      <ArrowRight
        className="w-4 h-4 mt-0.5 shrink-0 text-black"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-black">
          {context.title}
        </p>
        <p className="mt-1 text-xs text-neutral-700 leading-relaxed">
          {context.description}
        </p>
      </div>
    </div>
  );
}

interface AuthGoogleButtonProps {
  label: string;
  disabled?: boolean;
}

/** Secondary Google auth action communicating current OAuth integration availability honestly. */
export function AuthGoogleButton({
  label,
  disabled = false,
}: AuthGoogleButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`w-full min-h-[46px] px-4 py-2.5 border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-black transition-colors inline-flex items-center justify-center gap-2.5 disabled:opacity-50 ${AUTH_FOCUS_RING}`}
      onClick={() =>
        toast("Integrasi Google OAuth belum tersedia.", {
          icon: (
            <Info className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          ),
        })
      }
    >
      <FcGoogle className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold text-neutral-900">{label}</span>
    </button>
  );
}
