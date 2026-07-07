import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Restricting img-src/connect-src is the load-bearing
// mitigation against prompt-injection exfiltration: AI-generated note/chat
// markdown can't make the browser fetch an attacker's host for an image or
// XHR. YouTube embeds (iframes) and thumbnails are explicitly allowed.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https://i.ytimg.com https://img.youtube.com",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "style-src 'self' 'unsafe-inline'",
  // Next.js injects inline bootstrap scripts; dev additionally needs eval + ws.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${isDev ? " ws:" : ""}`,
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
