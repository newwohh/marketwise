export function GET() {
  return Response.json({ status: "ok", service: "marketwise", version: "1.0.0" });
}
