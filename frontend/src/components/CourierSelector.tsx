import { useEffect, useState } from "react";
import { Truck, Clock, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/format";
import type { CourierOption } from "@/types";

const FALLBACK_COURIERS: CourierOption[] = [
  {
    code: "JNE-REG",
    name: "JNE Reguler",
    service: "REG",
    cost: 18000,
    estimatedDays: "2 - 3 hari",
    description: "Pengiriman reguler ke seluruh Indonesia",
  },
  {
    code: "SICEPAT-REG",
    name: "SiCepat REG",
    service: "REG",
    cost: 16000,
    estimatedDays: "1 - 2 hari",
    description: "Layanan pengiriman cepat dengan tarif ekonomis",
  },
  {
    code: "JNT-EZ",
    name: "J&T Express",
    service: "EZ",
    cost: 17000,
    estimatedDays: "2 - 3 hari",
    description: "Pengiriman reguler dengan jangkauan luas",
  },
  {
    code: "JNE-YES",
    name: "JNE YES",
    service: "YES",
    cost: 32000,
    estimatedDays: "1 hari (Besok Sampai)",
    description: "Yakin Esok Sampai untuk pengiriman kilat",
  },
];

type CourierSelectorProps = {
  selectedCourier: CourierOption;
  onSelect: (courier: CourierOption) => void;
  disabled?: boolean;
};

export default function CourierSelector({
  selectedCourier,
  onSelect,
  disabled = false,
}: CourierSelectorProps) {
  const [couriers, setCouriers] = useState<CourierOption[]>(FALLBACK_COURIERS);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: CourierOption[];
        }>("/shipping/couriers");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCouriers(res.data);
        }
      } catch {
        // Fallback to default couriers if offline
      }
    };
    void fetchCouriers();
  }, []);

  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
        <Truck size={16} className="text-black" aria-hidden="true" />
        <span>Pilih Kurir & Ekspedisi Pengiriman</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {couriers.map((courier) => {
          const isSelected =
            selectedCourier.code === courier.code ||
            selectedCourier.name === courier.name;
          return (
            <button
              key={courier.code}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(courier)}
              className={`text-left p-3 border transition-colors flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-black bg-neutral-100 ring-1 ring-black"
                  : "border-neutral-300 bg-white hover:border-black"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold text-neutral-950 block">
                    {courier.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600 mt-0.5">
                    <Clock size={11} aria-hidden="true" />
                    Estimasi {courier.estimatedDays}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2
                    size={16}
                    className="text-black flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-200 text-neutral-800">
                  {courier.service}
                </span>
                <span className="text-xs font-bold text-black tabular-nums">
                  {formatCurrency(courier.cost)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

