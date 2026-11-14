import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
export default function sitemap(): MetadataRoute.Sitemap { const site = process.env.NEXT_PUBLIC_SITE_URL || "https://marketwise.bynevin.dev"; return ["", "/markets", "/simulator", "/learn", ...articles.map(a => `/learn/${a.slug}`)].map(path => ({ url: `${site}${path}`, changeFrequency: path === "/markets" ? "daily" : "monthly" })); }
