import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/navigation";

const config: NextConfig = {
  poweredByHeader: false,
  async redirects() { return legacyRedirects; },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
