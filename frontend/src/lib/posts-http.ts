// Small same-origin JSON boundary shared by content mutation routes.
export class ContentRequestError extends Error { constructor(message: string, public status: number) { super(message); } }
export function requireContentOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  if (origin !== expected) throw new ContentRequestError("This action must come from the Marketwise site.", 403);
}
export async function contentJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ContentRequestError("Send JSON content.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ContentRequestError("Missing request body.", 400);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 210000) { await reader.cancel(); throw new ContentRequestError("This request is too large.", 413); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ContentRequestError("Invalid JSON content.", 400); }
  } finally { reader.releaseLock(); }
}
export function contentFailure(error: unknown) {
  return Response.json({ error: error instanceof ContentRequestError ? error.message : "The content service is unavailable. Please try again." }, { status: error instanceof ContentRequestError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
