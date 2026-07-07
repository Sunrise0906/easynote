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
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
        The EasyNote blog
      </h1>
      <p className="mt-3 text-slate-600">
        Practical ideas on learning faster and remembering longer.
      </p>
      <div className="mt-10 space-y-5">
        {BLOG_POSTS.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{p.emoji}</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {p.excerpt}
                </p>
                <div className="mt-3 text-xs text-slate-400">
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
