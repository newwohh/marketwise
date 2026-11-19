import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), identity: vi.fn(), revalidate: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
vi.mock("../src/lib/supabase-server", () => ({ createServerSupabase: mocks.client }));
vi.mock("../src/lib/auth", () => ({ getAuthenticatedUser: mocks.identity }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { requestPasswordReset, signIn, signUp, updatePassword, updateProfile } from "../src/app/account/actions";
const previous = { ok: false, message: "" };
function form(values: Record<string, string>) { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data; }
beforeEach(() => { vi.clearAllMocks(); mocks.client.mockResolvedValue(null); mocks.identity.mockResolvedValue({ user: null, supabase: null }); });
describe("account server actions", () => {
  it("never attempts a provider request for invalid sign-up inputs", async () => {
    const result = await signUp(previous, form({ email: "bad", password: "short", displayName: "Name" }));
    expect(result.ok).toBe(false); expect(mocks.client).not.toHaveBeenCalled();
  });
  it("reports missing configuration rather than fabricating a session", async () => {
    const result = await signIn(previous, form({ email: "member@example.com", password: "REDACTED_CONFIGURE_LOCALLY" }));
    expect(result.ok).toBe(false); expect(result.message).toContain("not connected"); expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("redirects only after the provider accepts sign-in", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null }); mocks.client.mockResolvedValue({ auth: { signInWithPassword } });
    await expect(signIn(previous, form({ email: "member@example.com", password: "password" }))).rejects.toThrow("REDIRECT:/account");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "member@example.com", password: "password" });
  });
  it("does not expose provider internals or an account-existence signal on failed sign-in", async () => {
    mocks.client.mockResolvedValue({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "SECRET INTERNAL DETAIL", code: "user_not_found" } }) } });
    const result = await signIn(previous, form({ email: "member@example.com", password: "password" }));
    expect(result.ok).toBe(false); expect(result.message).not.toContain("SECRET"); expect(result.message).not.toContain("user_not_found");
  });
  it("uses a generic successful reset response and canonical callback", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null }); mocks.client.mockResolvedValue({ auth: { resetPasswordForEmail } });
    const result = await requestPasswordReset(previous, form({ email: "member@example.com" }));
    expect(result.ok).toBe(true); expect(result.message).toContain("If an account exists");
    const redirect = resetPasswordForEmail.mock.calls[0][1].redirectTo;
    expect(new URL(redirect).pathname).toBe("/auth/callback"); expect(new URL(redirect).searchParams.get("next")).toBe("/account/password");
  });
  it("requires a validated identity before changing a password", async () => {
    const updateUser = vi.fn(); mocks.identity.mockResolvedValue({ user: null, supabase: { auth: { updateUser } } });
    const result = await updatePassword(previous, form({ password: "REDACTED_CONFIGURE_LOCALLY", confirmPassword: "REDACTED_CONFIGURE_LOCALLY" }));
    expect(result.ok).toBe(false); expect(updateUser).not.toHaveBeenCalled();
  });
  it("ignores a forged profile user ID and writes only the validated current user", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null }), updateUser = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert }); mocks.identity.mockResolvedValue({ user: { id: "verified-user" }, supabase: { from, auth: { updateUser } } });
    const result = await updateProfile(previous, form({ displayName: "New name", userId: "victim-user" }));
    expect(result.ok).toBe(true); expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "verified-user", display_name: "New name" }));
    expect(updateUser).toHaveBeenCalledWith({ data: { display_name: "New name" } });
  });
});
