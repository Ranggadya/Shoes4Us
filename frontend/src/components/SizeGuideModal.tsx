import { useState } from "react";
import { Ruler, Check, X } from "lucide-react";
import {
  convertFootLengthToSize,
  FootFitPreference,
} from "@/utils/size-converter";

type SizeGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (euSize: string) => void;
};

export default function SizeGuideModal({
  isOpen,
  onClose,
  onSelectSize,
}: SizeGuideModalProps) {
  const [footLength, setFootLength] = useState<number>(26.0);
  const [fit, setFit] = useState<FootFitPreference>("REGULAR");

  if (!isOpen) return null;

  const recommendation = convertFootLengthToSize(footLength, fit);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Kalkulator & Panduan Ukuran Sepatu"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gray-950 text-white flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Kalkulator Ukuran Sepatu
              </h3>
              <p className="text-xs text-gray-500">
                Ukur panjang telapak kaki Anda (tumit ke ujung jari terpanjang)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan ukuran"
            className="p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="foot-length-slider"
                className="text-xs font-bold uppercase tracking-wider text-gray-700"
              >
                Panjang Kaki (CM)
              </label>
              <span className="text-base font-extrabold text-gray-950 bg-gray-100 px-3 py-1 rounded-full">
                {footLength.toFixed(1)} cm
              </span>
            </div>
            <input
              id="foot-length-slider"
              type="range"
              min={22.0}
              max={30.0}
              step={0.5}
              value={footLength}
              onChange={(e) => setFootLength(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>22.0 cm</span>
              <span>26.0 cm</span>
              <span>30.0 cm</span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Tipe Bentuk Kaki / Kenyamanan
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "SNUG", label: "Pas (Snug)" },
                  { id: "REGULAR", label: "Normal" },
                  { id: "WIDE", label: "Lebar (Wide)" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFit(option.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    fit === option.id
                      ? "bg-gray-950 text-white border-gray-950"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F6F8] border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Rekomendasi Ukuran Anda
            </p>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              <div className="bg-gray-950 text-white p-2.5 rounded-xl">
                <span className="block text-[10px] text-gray-400 uppercase">
                  EU
                </span>
                <span className="text-lg font-extrabold">
                  {recommendation.eu}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                <span className="block text-[10px] text-gray-400 uppercase">
                  US Pria
                </span>
                <span className="text-base font-bold text-gray-900">
                  {recommendation.usMen}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                <span className="block text-[10px] text-gray-400 uppercase">
                  US Wanita
                </span>
                <span className="text-base font-bold text-gray-900">
                  {recommendation.usWomen}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                <span className="block text-[10px] text-gray-400 uppercase">
                  UK
                </span>
                <span className="text-base font-bold text-gray-900">
                  {recommendation.uk}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Tutup
            </button>
            {onSelectSize && (
              <button
                type="button"
                onClick={() => {
                  onSelectSize(String(recommendation.eu));
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 transition"
              >
                <Check className="w-4 h-4" />
                Gunakan Ukuran EU {recommendation.eu}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

