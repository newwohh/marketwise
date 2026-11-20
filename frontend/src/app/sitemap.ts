import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
export default function sitemap(): MetadataRoute.Sitemap { const site = process.env.NEXT_PUBLIC_SITE_URL || "https://marketwise.bynevin.dev"; return ["", "/markets", "/cryptocurrency", "/stocks", "/forex", "/heatmap/cryptocurrency", "/heatmap/stocks", "/news", "/blogs", "/explore", "/grow", "/about", "/faq", "/user_protection", "/simulator", "/learn", ...articles.map(a => `/learn/${a.slug}`)].map(path => ({ url: `${site}${path}`, changeFrequency: path === "/markets" ? "daily" : "monthly" })); }
