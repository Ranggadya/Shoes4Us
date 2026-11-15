import { describe, it, expect } from "vitest";
import {
  getUtf8ByteLength,
  validateEmailFormat,
  validateNameField,
  validatePasswordField,
} from "../auth-validation";

describe("auth-validation helpers", () => {
  it("validates person names by Unicode code-point bounds (2..100)", () => {
    expect(validateNameField("   ")).toBe("Nama lengkap wajib diisi.");
    // Single multi-byte char is still < 2 Unicode chars
    expect(validateNameField("Ā")).toBe("Nama lengkap minimal 2 karakter.");
    expect(validateNameField("Āā")).toBeNull();
    expect(validateNameField("a".repeat(101))).toBe(
      "Nama lengkap maksimal 100 karakter."
    );
  });

  it("validates email syntax, dot placement, and 254-byte max limit", () => {
    expect(validateEmailFormat("user@shoes4us.com")).toBeNull();
    expect(validateEmailFormat("user@localhost")).toMatch(/valid/i);
    expect(validateEmailFormat("user@.bad.com")).toMatch(/valid/i);
    expect(validateEmailFormat("user@bad..com")).toMatch(/valid/i);
    expect(validateEmailFormat("bad email@shoes4us.com")).toMatch(/valid/i);
    expect(validateEmailFormat(`${"a".repeat(250)}@x.com`)).toMatch(/valid/i);
  });

  it("validates passwords against 8-char min and 72 UTF-8 byte bcrypt limit", () => {
    expect(validatePasswordField("")).toBe("Password wajib diisi.");
    expect(validatePasswordField("1234567")).toBe(
      "Password minimal 8 karakter."
    );
    expect(validatePasswordField("12345678")).toBeNull();
    // 37 'é' characters = 37 code points, 74 UTF-8 bytes (> 72)
    expect(getUtf8ByteLength("é".repeat(37))).toBe(74);
    expect(validatePasswordField("é".repeat(37))).toBe(
      "Password maksimal 72 byte."
    );
    expect(
      validatePasswordField("é".repeat(37), { label: "Password baru" })
    ).toBe("Password baru maksimal 72 byte.");
  });
});
