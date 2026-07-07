import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // The recording page needs the microphone; nothing needs camera/geo.
    value: "camera=(), geolocation=(), microphone=(self)",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  redirects: async () => [
    {
      source: "/",
      destination: "/home",
      permanent: false,
    },
  ],
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
