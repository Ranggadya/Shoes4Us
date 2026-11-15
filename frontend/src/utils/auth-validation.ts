export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_BYTES = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Compute exact UTF-8 byte length so password and email bounds match the Go backend. */
export function getUtf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  let bytes = 0;
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp <= 0x7f) bytes += 1;
    else if (cp <= 0x7ff) bytes += 2;
    else if (cp <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

export function getUnicodeLength(value: string): number {
  return Array.from(value).length;
}

export function validateNameField(rawName: string): string | null {
  const trimmed = rawName.trim();
  const length = getUnicodeLength(trimmed);
  if (!trimmed) {
    return "Nama lengkap wajib diisi.";
  }
  if (length < NAME_MIN_LENGTH) {
    return "Nama lengkap minimal 2 karakter.";
  }
  if (length > NAME_MAX_LENGTH) {
    return "Nama lengkap maksimal 100 karakter.";
  }
  return null;
}

export function validateEmailFormat(
  rawEmail: string,
  options: { requiredMessage?: string; invalidMessage?: string } = {}
): string | null {
  const trimmed = rawEmail.trim();
  if (!trimmed) {
    return options.requiredMessage ?? "Masukkan alamat email yang valid.";
  }
  if (
    getUtf8ByteLength(trimmed) > EMAIL_MAX_BYTES ||
    !EMAIL_PATTERN.test(trimmed)
  ) {
    return options.invalidMessage ?? "Masukkan alamat email yang valid.";
  }
  const domainPart = trimmed.slice(trimmed.indexOf("@") + 1);
  if (
    domainPart.startsWith(".") ||
    domainPart.endsWith(".") ||
    domainPart.includes("..")
  ) {
    return options.invalidMessage ?? "Masukkan alamat email yang valid.";
  }
  return null;
}

export function validatePasswordField(
  password: string,
  options: { requiredMessage?: string; label?: string } = {}
): string | null {
  const label = options.label ?? "Password";
  if (!password) {
    return options.requiredMessage ?? `${label} wajib diisi.`;
  }
  if (getUnicodeLength(password) < PASSWORD_MIN_LENGTH) {
    return `${label} minimal 8 karakter.`;
  }
  if (getUtf8ByteLength(password) > PASSWORD_MAX_BYTES) {
    return `${label} maksimal 72 byte.`;
  }
  return null;
}
