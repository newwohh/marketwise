// Public post reads use the anon/user client and published predicate, never a service role.
import { getAuthenticatedUser } from "@/lib/auth";
import { postId, publicPostColumns } from "./posts-contract";
export type PublicPost = { id: string; title: string; body: string; author_name: string; published: boolean; created_at: string; updated_at: string };
export async function publicPosts(page = 0): Promise<{ posts: PublicPost[]; available: boolean; nextPage: number | null }> {
  try { const { supabase } = await getAuthenticatedUser(); if (!supabase) return { posts: [], available: false, nextPage: null }; const { data, error } = await supabase.from("posts").select(publicPostColumns).eq("published", true).order("updated_at", { ascending: false }).range(page * 20, page * 20 + 20); return error ? { posts: [], available: false, nextPage: null } : { posts: (data as PublicPost[]).slice(0, 20).map(post => ({ ...post, body: post.body.slice(0, 1000) })), available: true, nextPage: data.length > 20 ? page + 1 : null }; } catch { return { posts: [], available: false, nextPage: null }; }
}
export async function publicPost(id: string): Promise<PublicPost | null> {
  if (!postId.safeParse(id).success) return null;
  try { const { supabase } = await getAuthenticatedUser(); if (!supabase) return null; const { data, error } = await supabase.from("posts").select(publicPostColumns).eq("id", id).eq("published", true).maybeSingle(); return error ? null : data as PublicPost | null; } catch { return null; }
}
