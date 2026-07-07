import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BLOG_POSTS, getPost } from "@/lib/blog";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post ? post.title : "Blog" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft size={16} /> All posts
      </Link>
      <div className="mt-6 text-4xl">{post.emoji}</div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {post.title}
      </h1>
      <div className="mt-3 text-sm text-slate-400">
        {new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        · {post.readMinutes} min read
      </div>
      <div className="md-prose mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
      </div>
      <div className="mt-12 rounded-2xl bg-brand-50 p-6 text-center">
        <div className="font-bold text-slate-900">
          Put it into practice with EasyNote
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Notes, flashcards and quizzes from anything you're learning — free.
        </p>
        <Link
          href="/login?mode=signup"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Try it free
        </Link>
      </div>
    </article>
  );
}
