import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Minimal Shoes4Us header rendered on authentication routes.
 * Hidden on desktop (`lg+`) for `/login` and `/register` so the split architectural rail
 * rises flush to the top edge while remaining anchored on mobile and sibling routes.
 */
export default function AuthNavbar() {
  const { pathname } = useLocation();
  const isSplitAuthRoute =
    pathname === "/login" || pathname === "/register";

  return (
    <nav
      aria-label="Navigasi autentikasi"
      className={`bg-white border-b border-neutral-200 sticky top-0 z-50 selection:bg-black selection:text-white ${
        isSplitAuthRoute ? "lg:hidden" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <img
            src="/logo.jpg"
            alt="Logo Shoes4Us"
            width={40}
            height={40}
            className="w-10 h-10 object-cover border border-neutral-200 shrink-0"
          />
          <span className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-black">
            Shoes4Us
          </span>
        </Link>

        <Link
          to="/"
          className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white text-xs font-bold uppercase tracking-[0.08em] text-neutral-900 hover:border-black hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Kembali ke Toko</span>
        </Link>
      </div>
    </nav>
  );
}
