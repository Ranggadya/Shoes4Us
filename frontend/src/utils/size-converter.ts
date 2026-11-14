export type FootFitPreference = "SNUG" | "REGULAR" | "WIDE";

export const EU_TO_US_MAP: Record<string, string> = {
  "36": "US 5.5",
  "37": "US 6",
  "38": "US 7",
  "39": "US 7.5",
  "40": "US 8",
  "41": "US 8.5",
  "42": "US 9.5",
  "43": "US 10",
  "44": "US 10.5",
  "45": "US 11",
};

export function formatShoeSizeLabel(rawSize?: string | null): string {
  if (!rawSize) return "";
  const trimmed = rawSize.trim();
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase();
  if (upper.startsWith("US")) {
    return upper;
  }
  if (upper.startsWith("EU ")) {
    const euCode = upper.slice(3).trim();
    return EU_TO_US_MAP[euCode]
      ? `${EU_TO_US_MAP[euCode]} / EU ${euCode}`
      : `EU ${euCode}`;
  }

  return EU_TO_US_MAP[trimmed]
    ? `${EU_TO_US_MAP[trimmed]} / EU ${trimmed}`
    : `EU ${trimmed}`;
}

export interface ShoeSizeConversion {
  eu: number;
  usMen: number;
  usWomen: number;
  uk: number;
}

const SIZE_TABLE: Array<{
  maxCm: number;
  eu: number;
  usMen: number;
  usWomen: number;
  uk: number;
}> = [
  { maxCm: 22.5, eu: 36, usMen: 4.5, usWomen: 6, uk: 4 },
  { maxCm: 23.5, eu: 37, usMen: 5, usWomen: 6.5, uk: 4.5 },
  { maxCm: 24.0, eu: 38, usMen: 6, usWomen: 7.5, uk: 5.5 },
  { maxCm: 24.5, eu: 39, usMen: 6.5, usWomen: 8, uk: 6 },
  { maxCm: 25.5, eu: 40, usMen: 7, usWomen: 8.5, uk: 6.5 },
  { maxCm: 26.0, eu: 41, usMen: 8, usWomen: 9.5, uk: 7.5 },
  { maxCm: 26.5, eu: 42, usMen: 8.5, usWomen: 10, uk: 8 },
  { maxCm: 27.5, eu: 43, usMen: 9.5, usWomen: 11, uk: 9 },
  { maxCm: 28.0, eu: 44, usMen: 10, usWomen: 11.5, uk: 9.5 },
  { maxCm: 29.0, eu: 45, usMen: 11, usWomen: 12.5, uk: 10.5 },
  { maxCm: 30.0, eu: 46, usMen: 12, usWomen: 13.5, uk: 11.5 },
];

export function convertFootLengthToSize(
  footLengthCm: number,
  fit: FootFitPreference = "REGULAR"
): ShoeSizeConversion {
  const safeCm = Number.isFinite(footLengthCm)
    ? Math.max(20, Math.min(32, footLengthCm))
    : 26.0;

  let index = SIZE_TABLE.findIndex((row) => safeCm <= row.maxCm);
  if (index === -1) {
    index = SIZE_TABLE.length - 1;
  }

  if (fit === "WIDE" && index < SIZE_TABLE.length - 1) {
    index += 1;
  }

  const entry = SIZE_TABLE[index];
  return {
    eu: entry.eu,
    usMen: entry.usMen,
    usWomen: entry.usWomen,
    uk: entry.uk,
  };
}

