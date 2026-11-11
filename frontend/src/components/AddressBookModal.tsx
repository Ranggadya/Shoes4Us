import { useState, useEffect, FormEvent } from "react";
import { MapPin, Plus, Check, Trash2, X } from "lucide-react";
import type { ShippingAddressEntry } from "@/types";

const STORAGE_PREFIX = "shoes4us_address_book_v1";

function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function loadAddressBook(userId?: string | null): ShippingAddressEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShippingAddressEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.recipientName === "string" &&
          typeof item.streetAddress === "string"
      )
      .map((item) => ({
        id: item.id,
        label: typeof item.label === "string" && item.label ? item.label : "Rumah",
        recipientName: item.recipientName,
        phone: typeof item.phone === "string" ? item.phone : "",
        streetAddress: item.streetAddress,
        city: typeof item.city === "string" ? item.city : "",
        postalCode: typeof item.postalCode === "string" ? item.postalCode : "",
        isDefault: Boolean(item.isDefault),
      }));
  } catch {
    return [];
  }
}

export function saveAddressBook(
  userId: string | null | undefined,
  entries: ShippingAddressEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

type AddressBookModalProps = {
  isOpen: boolean;
  userId?: string | null;
  onClose: () => void;
  onSelect: (address: ShippingAddressEntry) => void;
};

export default function AddressBookModal({
  isOpen,
  userId,
  onClose,
  onSelect,
}: AddressBookModalProps) {
  const [addresses, setAddresses] = useState<ShippingAddressEntry[]>(() =>
    loadAddressBook(userId)
  );
  const [addingNew, setAddingNew] = useState(false);
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAddresses(loadAddressBook(userId));
      setAddingNew(false);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSaveNew = (e: FormEvent) => {
    e.preventDefault();
    if (
      !recipientName.trim() ||
      !phone.trim() ||
      !streetAddress.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      return;
    }

    const shouldBeDefault = isDefault || addresses.length === 0;
    const newEntry: ShippingAddressEntry = {
      id: `addr-${Date.now()}`,
      label: label.trim() || "Rumah",
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      isDefault: shouldBeDefault,
    };

    const next = shouldBeDefault
      ? [...addresses.map((a) => ({ ...a, isDefault: false })), newEntry]
      : [...addresses, newEntry];

    setAddresses(next);
    saveAddressBook(userId, next);
    setAddingNew(false);
    setLabel("");
    setRecipientName("");
    setPhone("");
    setStreetAddress("");
    setCity("");
    setPostalCode("");
    setIsDefault(false);
  };

  const handleSetDefault = (id: string) => {
    const next = addresses.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    setAddresses(next);
    saveAddressBook(userId, next);
  };

  const handleDelete = (id: string) => {
    const next = addresses.filter((item) => item.id !== id);
    setAddresses(next);
    saveAddressBook(userId, next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Buku Alamat Pengiriman"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gray-950 text-white flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Buku Alamat Pengiriman
              </h3>
              <p className="text-xs text-gray-500">
                Pilih atau simpan alamat untuk checkout cepat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup buku alamat"
            className="p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {addresses.length === 0 && !addingNew && (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                Belum ada alamat tersimpan.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tambahkan alamat Rumah atau Kantor Anda.
              </p>
            </div>
          )}

          {addresses.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition ${
                item.isDefault
                  ? "border-gray-950 bg-gray-50/70"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-900 text-white">
                    {item.label}
                  </span>
                  {item.isDefault && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-emerald-900">
                      Utama
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!item.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(item.id)}
                      className="text-xs text-gray-500 hover:text-black px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      Jadikan Utama
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Hapus alamat ${item.label}`}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-sm">
                <p className="font-bold text-gray-900">
                  {item.recipientName}{" "}
                  <span className="font-normal text-gray-500">
                    ({item.phone})
                  </span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {item.streetAddress}, {item.city}, {item.postalCode}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold hover:bg-gray-800 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Pilih Alamat Ini
                </button>
              </div>
            </div>
          ))}

          {addingNew ? (
            <form
              onSubmit={handleSaveNew}
              className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3"
            >
              <h4 className="text-sm font-bold text-gray-900">
                Tambah Alamat Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Contoh: Rumah, Kantor"
                  className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  required
                />
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama penerima"
                  className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  required
                />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor telepon"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                required
              />
              <textarea
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Nama jalan, gedung, nomor rumah"
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kota / Kabupaten"
                  className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  required
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Kode pos"
                  className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                Jadikan sebagai alamat utama
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddingNew(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition"
                >
                  Simpan Alamat
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-xs font-bold text-gray-800 hover:border-gray-950 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Alamat Baru
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
