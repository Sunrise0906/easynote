import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { appUrl } from "@/lib/config";

// Resolve APP_URL at request time, not build time — the Docker builder has no
// APP_URL, so a static export would bake in http://localhost:3000.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const pages = [
    "/home",
    "/features",
    "/price",
    "/faq",
    "/about",
    "/blog",
    "/terms",
    "/privacy",
    "/login",
  ].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "/home" ? 1 : 0.7,
  }));
  const posts = BLOG_POSTS.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...pages, ...posts];
}
