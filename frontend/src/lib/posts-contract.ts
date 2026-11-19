// Input contracts for user-authored content and account-scoped watchlists.
// Clients cannot choose an author or user ID; route handlers derive identity from auth.
import { z } from "zod";
export const postInput = z.object({ title: z.string().trim().min(1).max(160).regex(/^[^\x00-\x1f\x7f]+$/), body: z.string().trim().min(1).max(50000).regex(/^[^\x00-\x08\x0b\x0c\x0e-\x1f\x7f]+$/), published: z.boolean().default(false) }).strict();
export const postId = z.string().uuid();
export const watchlistItem = z.string().max(90).regex(/^(crypto|stocks|forex):[a-zA-Z0-9][a-zA-Z0-9._/-]{0,79}$/);
export const watchlistInput = z.object({ items: z.array(watchlistItem).max(100) }).strict();
export function watchlistRows(items: string[], userId: string) {
  return [...new Set(items)].map(key => { const split = key.indexOf(":"); return { user_id: userId, market: key.slice(0, split), symbol: key.slice(split + 1) }; });
}
export function publicAuthorName(metadata: Record<string, unknown> | undefined) {
  const name = metadata?.display_name;
  return typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : "Marketwise contributor";
}
export const publicPostColumns = "id,title,body,author_name,published,created_at,updated_at";
