import { MessageCircle } from "lucide-react";

const WHATSAPP_PHONE = "6281234567890";

export function buildWhatsAppSupportUrl(productContext?: string): string {
  const message = productContext
    ? `Halo Admin Shoes4Us, saya ingin bertanya mengenai ketersediaan & ukuran untuk produk: ${productContext}`
    : "Halo Admin Shoes4Us, saya butuh bantuan terkait pemesanan sepatu.";
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppSupportButton() {
  return (
    <a
      href={buildWhatsAppSupportUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat Bantuan WhatsApp Shoes4Us"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gray-950 text-white shadow-lg hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black transition group"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
      <MessageCircle className="w-4 h-4" />
      <span className="text-xs font-bold tracking-wide hidden sm:inline">
        Tanya Ukuran / CS
      </span>
    </a>
  );
}

