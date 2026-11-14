// Post ownership is checked server-side on every mutation; a URL ID is never authority.
import { getAuthenticatedUser } from "@/lib/auth";
import { postId, postInput, publicPostColumns } from "@/lib/posts-contract";
import { contentFailure, contentJson, ContentRequestError, requireContentOrigin } from "@/lib/posts-http";
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "no-store" };
async function identity(context: Context) { const { id } = await context.params; if (!postId.safeParse(id).success) throw new ContentRequestError("This field note was not found.", 404); return id; }
export async function GET(_request: Request, context: Context) {
  try { const id = await identity(context); const { supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Community publishing is not configured yet.", 503); const { data, error } = await supabase.from("posts").select(publicPostColumns).eq("id", id).eq("published", true).maybeSingle(); if (error) throw error; if (!data) throw new ContentRequestError("This field note was not found.", 404); return Response.json({ post: data }, { headers }); } catch (error) { return contentFailure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { requireContentOrigin(request); const id = await identity(context); const { user, supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Community publishing is not configured yet.", 503); if (!user) throw new ContentRequestError("Sign in to edit your field note.", 401); const parsed = postInput.safeParse(await contentJson(request)); if (!parsed.success) throw new ContentRequestError("Use a title of 1–160 characters and a field note of 1–50,000 characters.", 400); const { data, error } = await supabase.from("posts").update(parsed.data).eq("id", id).eq("author_id", user.id).select(publicPostColumns).maybeSingle(); if (error) throw error; if (!data) throw new ContentRequestError("This field note was not found in your account.", 404); return Response.json({ post: data }, { headers }); } catch (error) { return contentFailure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try { requireContentOrigin(request); const id = await identity(context); const { user, supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Community publishing is not configured yet.", 503); if (!user) throw new ContentRequestError("Sign in to delete your field note.", 401); const { data, error } = await supabase.from("posts").delete().eq("id", id).eq("author_id", user.id).select("id").maybeSingle(); if (error) throw error; if (!data) throw new ContentRequestError("This field note was not found in your account.", 404); return Response.json({ deleted: id }, { headers }); } catch (error) { return contentFailure(error); }
}
