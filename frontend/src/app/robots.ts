import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { const site = process.env.NEXT_PUBLIC_SITE_URL || "https://marketwise.bynevin.dev"; return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account/", "/auth/"] }, sitemap: `${site}/sitemap.xml` }; }
