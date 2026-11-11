import { describe, it, expect } from "vitest";
import { checkPasswordStrength } from "../password-strength";

describe("checkPasswordStrength", () => {
  it("returns Kosong for empty password", () => {
    const res = checkPasswordStrength("");
    expect(res.label).toBe("Kosong");
    expect(res.percentage).toBe(0);
  });

  it("returns Lemah when only 1 criterion is met", () => {
    const res = checkPasswordStrength("abcdef");
    expect(res.label).toBe("Lemah");
    expect(res.percentage).toBe(25);
    expect(res.feedback).toContain("Minimal 8 karakter");
  });

  it("returns Sedang when 2 criteria are met", () => {
    const res = checkPasswordStrength("abcdefgh1");
    expect(res.label).toBe("Sedang");
    expect(res.percentage).toBe(50);
  });

  it("returns Kuat when 3 criteria are met", () => {
    const res = checkPasswordStrength("Abcdefgh1");
    expect(res.label).toBe("Kuat");
    expect(res.percentage).toBe(75);
  });

  it("returns Sangat Kuat when all 4 criteria are met", () => {
    const res = checkPasswordStrength("Abcdefgh1!");
    expect(res.label).toBe("Sangat Kuat");
    expect(res.percentage).toBe(100);
    expect(res.feedback).toHaveLength(0);
  });
});
