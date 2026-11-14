import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SUPPORT_CONTACT } from "@/constants/contact";

const IGNORED_TITLES = new Set([
  "",
  "Shoes4Us",
  "Shoes4Us - E-Commerce Sepatu Stylish",
]);

function extractProductTitleFromDocument(
  pathname: string,
  docTitle: string
): string | undefined {
  if (!pathname.startsWith("/product/")) {
    return undefined;
  }

  const stripped = docTitle.replace(/\s*\|\s*Shoes4Us\s*$/i, "").trim();
  if (
    !stripped ||
    IGNORED_TITLES.has(stripped) ||
    stripped.startsWith("Koleksi Sepatu")
  ) {
    return undefined;
  }

  return stripped;
}

export function buildWhatsAppSupportUrl(
  productContext?: string,
  pageUrl?: string
): string {
  const normalizedContext = productContext?.trim();
  const baseMessage = normalizedContext
    ? `Halo Admin Shoes4Us, saya ingin bertanya mengenai ketersediaan & ukuran untuk produk: ${normalizedContext}`
    : "Halo Admin Shoes4Us, saya butuh bantuan terkait pemesanan sepatu.";
  const fullMessage =
    normalizedContext && pageUrl
      ? `${baseMessage}\nLink produk: ${pageUrl}`
      : baseMessage;

  return `https://wa.me/${SUPPORT_CONTACT.whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
}

export default function WhatsAppSupportButton() {
  const { pathname } = useLocation();
  const [productContext, setProductContext] = useState<string | undefined>(() =>
    typeof document !== "undefined"
      ? extractProductTitleFromDocument(pathname, document.title)
      : undefined
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncTitle = () => {
      const nextContext = extractProductTitleFromDocument(
        pathname,
        document.title
      );
      setProductContext((prev) => (prev === nextContext ? prev : nextContext));
    };

    syncTitle();

    if (!pathname.startsWith("/product/") || !document.head) {
      return;
    }

    const observer = new MutationObserver(syncTitle);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : undefined;
  const href = buildWhatsAppSupportUrl(productContext, pageUrl);
  const hideOnMobileCart = pathname === "/cart";
  const ariaLabel = productContext
    ? `Chat Bantuan WhatsApp Shoes4Us mengenai ${productContext} (buka di tab baru)`
    : "Chat Bantuan WhatsApp Shoes4Us (buka di tab baru)";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 print:hidden ${
        hideOnMobileCart ? "hidden lg:inline-flex" : "inline-flex"
      } items-center justify-center gap-2.5 min-w-[44px] min-h-[44px] px-3 sm:px-4 bg-black text-white border border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.18)] hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4 shrink-0 text-[#25D366]"
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.438-.516.078-1.188.141-1.938-.094-.453-.141-1.047-.344-1.781-.656-3.125-1.344-5.156-4.5-5.313-4.703-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.313.609-.391.813-.391.203 0 .406.016.578.016.188 0 .438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.109.203-.156.344-.313.531-.156.188-.328.406-.469.547-.156.156-.313.328-.141.641.172.313.781 1.297 1.672 2.094 1.156 1.031 2.125 1.344 2.438 1.5.313.156.484.125.672-.078.188-.203.781-.906.984-1.219.203-.313.406-.266.688-.156.281.109 1.797.844 2.109 1 .313.156.516.234.594.359.078.125.078.734-.172 1.438z" />
      </svg>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] hidden sm:inline">
        Tanya CS
      </span>
    </a>
  );
}
