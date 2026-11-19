import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("../src/lib/supabase-server", () => ({ createServerSupabase: state.client }));
import { GET } from "../src/app/auth/callback/route";
beforeEach(() => { vi.clearAllMocks(); state.client.mockResolvedValue(null); });
describe("confirmation and recovery callback", () => {
  it("does not create a success session without configured services", async () => {
    const response = await GET(new Request("https://marketwise.example/auth/callback?code=code"));
    expect(response.headers.get("location")).toBe("https://marketwise.example/account?notice=confirmation");
  });
  it.each(["//evil.example", "/\t/evil.example", "https://evil.example", "/\\evil.example"])("keeps successful confirmation on this origin for unsafe next %j", async target => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    state.client.mockResolvedValue({ auth: { exchangeCodeForSession } });
    const url = new URL("https://marketwise.example/auth/callback?code=provider-code"); url.searchParams.set("next", target);
    const response = await GET(new Request(url));
    expect(response.headers.get("location")).toBe("https://marketwise.example/account");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("provider-code");
  });
  it("sends verified recovery links to the password form", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null }); state.client.mockResolvedValue({ auth: { verifyOtp } });
    const response = await GET(new Request("https://marketwise.example/auth/callback?token_hash=hash&type=recovery&next=/blogs"));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash", type: "recovery" });
    expect(response.headers.get("location")).toBe("https://marketwise.example/account/password");
  });
  it("rejects unrecognized OTP types before calling the provider", async () => {
    const verifyOtp = vi.fn(); state.client.mockResolvedValue({ auth: { verifyOtp } });
    await GET(new Request("https://marketwise.example/auth/callback?token_hash=hash&type=arbitrary"));
    expect(verifyOtp).not.toHaveBeenCalled();
  });
  it("handles expired/provider-rejected codes without exposing details", async () => {
    state.client.mockResolvedValue({ auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "sensitive provider error" } }) } });
    const response = await GET(new Request("https://marketwise.example/auth/callback?code=expired"));
    expect(response.headers.get("location")).toBe("https://marketwise.example/account?notice=confirmation");
  });
});
