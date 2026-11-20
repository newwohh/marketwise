import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabasePublicConfig } from "../src/lib/supabase-config";
import { displayNameInput, passwordInput, signinInput, signupInput } from "../src/lib/auth-inputs";
afterEach(() => vi.unstubAllEnvs());
describe("account configuration", () => {
  it("does not activate auth from a URL without a public key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(getSupabasePublicConfig()).toBeNull();
  });
  it("accepts localhost but refuses arbitrary insecure providers", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://untrusted.example"); expect(getSupabasePublicConfig()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321"); expect(getSupabasePublicConfig()?.url).toBe("http://127.0.0.1:54321");
  });
});
describe("account inputs", () => {
  it("normalizes email and name without changing passwords", () => {
    expect(signupInput.parse({ email: " member@example.com ", displayName: " Nevin ", password: "  long password  " })).toEqual({ email: "member@example.com", displayName: "Nevin", password: "  long password  " });
  });
  it("allows legacy shorter passwords at sign-in but not during new-password creation", () => {
    expect(signinInput.safeParse({ email: "member@example.com", password: "older-pass" }).success).toBe(true);
    expect(passwordInput.safeParse("older-pass").success).toBe(false);
  });
  it("rejects missing names and abusive input sizes", () => {
    expect(displayNameInput.safeParse(" ").success).toBe(false); expect(displayNameInput.safeParse("n".repeat(81)).success).toBe(false);
    expect(signupInput.safeParse({ email: "member@example.com", displayName: "Member", password: "p".repeat(129) }).success).toBe(false);
  });
});
