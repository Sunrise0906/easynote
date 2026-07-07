import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";

// Resolve APP_URL at request time (see sitemap.ts).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/notes", "/settings", "/recording", "/share/"],
      },
    ],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
