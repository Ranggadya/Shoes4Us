export interface SavedShippingAddress {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export const emptyShippingAddress: SavedShippingAddress = {
  label: "Rumah",
  recipient: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export function getShippingAddressStorageKey(userId?: string | null): string {
  return userId ? `shoes4us-address-${userId}` : "shoes4us-address";
}

export function loadSavedShippingAddress(
  userId?: string | null,
  fallbackRecipient = ""
): SavedShippingAddress {
  if (typeof window === "undefined") {
    return { ...emptyShippingAddress, recipient: fallbackRecipient };
  }

  const raw = window.localStorage.getItem(getShippingAddressStorageKey(userId));
  if (!raw) {
    return { ...emptyShippingAddress, recipient: fallbackRecipient };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedShippingAddress>;
    return {
      ...emptyShippingAddress,
      ...parsed,
      recipient: parsed.recipient || fallbackRecipient,
    };
  } catch {
    return { ...emptyShippingAddress, recipient: fallbackRecipient };
  }
}

export function saveShippingAddress(
  userId: string | null | undefined,
  address: Partial<SavedShippingAddress>
): SavedShippingAddress {
  const existing = loadSavedShippingAddress(userId, address.recipient || "");
  const merged: SavedShippingAddress = {
    ...existing,
    ...address,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      getShippingAddressStorageKey(userId),
      JSON.stringify(merged)
    );
  }
  return merged;
}
