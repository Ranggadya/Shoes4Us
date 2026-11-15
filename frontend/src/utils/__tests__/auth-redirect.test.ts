import { describe, it, expect } from "vitest";
import { getAuthRedirectContext, sanitizeAuthRedirect } from "../auth-redirect";

describe("sanitizeAuthRedirect", () => {
  it("allows internal storefront routes while preserving query and hash", () => {
    expect(sanitizeAuthRedirect("/payment?step=shipping#summary")).toBe(
      "/payment?step=shipping#summary"
    );
    expect(sanitizeAuthRedirect("/orders")).toBe("/orders");
  });

  it("rejects external, protocol-relative, backslash, and control-char URLs", () => {
    expect(sanitizeAuthRedirect(null)).toBe("/");
    expect(sanitizeAuthRedirect("https://evil.com")).toBe("/");
    expect(sanitizeAuthRedirect("//evil.com")).toBe("/");
    expect(sanitizeAuthRedirect("/\\evil.com")).toBe("/");
    expect(sanitizeAuthRedirect("/\tevil.com")).toBe("/");
    expect(sanitizeAuthRedirect(" /payment")).toBe("/");
  });

  it("blocks disallowed auth paths even with trailing slash or query params", () => {
    expect(sanitizeAuthRedirect("/login")).toBe("/");
    expect(sanitizeAuthRedirect("/login/")).toBe("/");
    expect(sanitizeAuthRedirect("/register?foo=1")).toBe("/");
    expect(sanitizeAuthRedirect("/login/?redirect=/payment")).toBe("/");
  });

  it("does not reflect raw arbitrary URL paths in fallback redirect context copy", () => {
    const ctx = getAuthRedirectContext("/products?q=sepatu-lari", "login");
    expect(ctx?.description).not.toContain("/products?q=sepatu-lari");
  });
});
