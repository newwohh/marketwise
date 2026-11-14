// Do not expose an ungated Pro export while authentication and billing are unconfigured.
export function GET() { return Response.json({ error: "CSV export is not available yet. Account and paid-plan access have not been enabled." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
