import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas on learning, note-taking and studying with AI.",
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
        The Recall blog
      </h1>
      <p className="mt-3 text-muted">
        Practical ideas on learning faster and remembering longer.
      </p>
      <div className="mt-10 space-y-5">
        {BLOG_POSTS.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block rounded-lg border border-border bg-surface p-6 transition hover:border-ink/25 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{p.emoji}</div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {p.excerpt}
                </p>
                <div className="mt-3 text-xs text-muted">
                  {new Date(p.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {p.readMinutes} min read
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
