// Normalize account input consistently without trimming or changing passwords.
import { z } from "zod";
export const emailInput = z.string().trim().email().max(254);
export const passwordInput = z.string().min(12).max(128);
export const displayNameInput = z.string().trim().min(1).max(80);
export const signupInput = z.object({ email: emailInput, password: passwordInput, displayName: displayNameInput });
export const signinInput = z.object({ email: emailInput, password: z.string().min(1).max(128) });
export function authNotice(code: string | undefined) {
  return code === "confirmation" ? "That confirmation link could not be verified. Request a fresh link and try again." : code === "signed-out" ? "You have signed out." : code === "signout-failed" ? "Sign-out could not be completed. Please try again." : null;
}
