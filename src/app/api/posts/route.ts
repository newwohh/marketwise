// Published community posts are readable publicly; author draft queries require a verified account.
import { getAuthenticatedUser } from "@/lib/auth";
import { postInput, publicAuthorName, publicPostColumns } from "@/lib/posts-contract";
import { contentFailure, contentJson, ContentRequestError, requireContentOrigin } from "@/lib/posts-http";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  try { const { user, supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Community publishing is not available until account services are configured.", 503); const params = new URL(request.url).searchParams; const mine = params.get("mine") === "1"; const page = Number(params.get("page") ?? "0"); if (!Number.isInteger(page) || page < 0 || page > 1000) throw new ContentRequestError("Choose a valid page.", 400); if (mine && !user) throw new ContentRequestError("Sign in to view your posts.", 401); let query = supabase.from("posts").select(publicPostColumns).order("updated_at", { ascending: false }).order("id", { ascending: false }).range(page * 20, page * 20 + 19); query = mine && user ? query.eq("author_id", user.id) : query.eq("published", true); const { data, error } = await query; if (error) throw error; return Response.json({ posts: data, nextPage: data.length === 20 ? page + 1 : null }, { headers }); } catch (error) { return contentFailure(error); }
}
export async function POST(request: Request) {
  try { requireContentOrigin(request); const { user, supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Community publishing is not configured yet.", 503); if (!user) throw new ContentRequestError("Sign in to publish a field note.", 401); const parsed = postInput.safeParse(await contentJson(request)); if (!parsed.success) throw new ContentRequestError("Use a title of 1–160 characters and a field note of 1–50,000 characters.", 400); const { data, error } = await supabase.from("posts").insert({ ...parsed.data, author_id: user.id, author_name: publicAuthorName(user.user_metadata) }).select(publicPostColumns).single(); if (error) throw error; return Response.json({ post: data }, { status: 201, headers }); } catch (error) { return contentFailure(error); }
}
