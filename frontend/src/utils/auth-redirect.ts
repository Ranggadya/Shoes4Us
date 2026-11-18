export const AUTH_MOBILE_ASSURANCE =
  "100% Original · Pilihan Ukuran US/EU · Tukar Ukuran 7 Hari";

export const AUTH_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

/** Build consistent sharp-cornered input styles for auth forms. */
export function getAuthInputClass(
  invalid: boolean,
  extraPadding = ""
): string {
  return `w-full min-h-[46px] border bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-500 caret-black focus-visible:outline-none transition-colors disabled:bg-neutral-100 disabled:text-neutral-500 ${
    invalid
      ? "border-red-600 focus-visible:border-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
      : "border-neutral-300 focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
  } ${extraPadding}`.trim();
}

function hasControlOrBackslashChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c) {
      return true;
    }
  }
  return false;
}

/** Reject protocol-relative, backslash, control-char, or external redirect targets. */
export function sanitizeAuthRedirect(
  target: string | null,
  disallowPaths: readonly string[] = ["/login", "/register"]
): string {
  if (!target || hasControlOrBackslashChar(target)) return "/";
  const trimmed = target.trim();
  if (trimmed !== target || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, "https://shoes4us.local");
  } catch {
    return "/";
  }

  if (
    parsed.origin !== "https://shoes4us.local" ||
    parsed.pathname.startsWith("//")
  ) {
    return "/";
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
  const blocked = disallowPaths.some(
    (path) => (path.replace(/\/+$/, "") || "/") === normalizedPath
  );
  if (blocked) {
    return "/";
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/** Provide contextual copy when visitors arrive at auth routes from a storefront task. */
export function getAuthRedirectContext(
  safeRedirect: string,
  mode: "login" | "register"
): { title: string; description: string } | null {
  if (safeRedirect === "/") return null;

  if (safeRedirect.startsWith("/payment") || safeRedirect.startsWith("/cart")) {
    return {
      title: "Melanjutkan ke Pengiriman & Pembayaran",
      description:
        mode === "login"
          ? "Item keranjang belanja tamu Anda akan disinkronkan ke akun secara otomatis setelah login berhasil."
          : "Item keranjang belanja tamu Anda akan disinkronkan ke akun baru secara otomatis setelah daftar berhasil.",
    };
  }

  if (safeRedirect.startsWith("/wishlist")) {
    return {
      title: "Melanjutkan ke Wishlist Anda",
      description:
        mode === "login"
          ? "Masuk untuk menyimpan dan mengelola daftar sepatu pilihan Anda."
          : "Buat akun untuk menyimpan dan mengelola daftar sepatu pilihan Anda.",
    };
  }

  if (safeRedirect.startsWith("/admin")) {
    return {
      title: "Portal Pengelola Shoes4Us",
      description:
        mode === "login"
          ? "Masuk menggunakan akun admin terdaftar untuk membuka dashboard toko."
          : "Dashboard pengelola hanya tersedia untuk akun admin. Masuk dengan akun admin jika Anda sudah terdaftar.",
    };
  }

  return {
    title: "Melanjutkan ke Halaman Tujuan",
    description:
      mode === "login"
        ? "Anda akan langsung diarahkan ke halaman tujuan setelah berhasil masuk."
        : "Anda akan langsung diarahkan ke halaman tujuan setelah pendaftaran berhasil.",
  };
}
