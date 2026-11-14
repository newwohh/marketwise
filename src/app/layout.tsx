import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://marketwise.bynevin.dev"),
  title: { default: "Marketwise — A clearer view. A wiser move.", template: "%s · Marketwise" },
  description: "Make sense of the markets. Follow crypto and currencies, build your watchlist, and explore investment scenarios in one considered workspace.",
  openGraph: { title: "Marketwise — A clearer view. A wiser move.", description: "Your perspective on the markets starts here.", type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></body></html>;
}
