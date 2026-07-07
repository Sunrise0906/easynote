import type { Metadata } from "next";
import { Suspense } from "react";
import PricingSection from "@/components/marketing/PricingSection";
import FAQList from "@/components/marketing/FAQList";
import CheckoutHandler from "./CheckoutHandler";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "EasyNote pricing: a generous free Starter plan, and Pro from $8.39/month for unlimited AI notes, flashcards, quizzes and chat.",
};

const PRICING_FAQ = [
  {
    q: "What's included in the free Starter plan?",
    a: "10 AI notes per month across every input type (recording, uploads, YouTube, PDF, images, text), plus flashcards, quizzes, mind maps, 30 AI chat messages a day, sharing and export. Free forever.",
  },
  {
    q: "How does the yearly discount work?",
    a: "Pro is $19.99 when billed monthly, or $100.68 up front for a year — which works out to $8.39/month, a 58% saving.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Downgrade from the Settings page whenever you like; you keep Pro features until the end of the paid period, and your notes are never deleted.",
  },
  {
    q: "Do unused notes roll over?",
    a: "Starter's 10 monthly notes reset at the start of each month and don't roll over. Pro has no meaningful limits, so there's nothing to roll.",
  },
  {
    q: "Is this demo really charging me?",
    a: "No. This is a self-hosted build of EasyNote — the checkout instantly switches your local account between plans without any payment processing.",
  },
];

export default function PricePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Invest in how you learn
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          One plan that&apos;s free forever, one that removes every limit.
        </p>
      </div>
      <div className="mt-10">
        <PricingSection />
      </div>
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center text-2xl font-extrabold text-slate-900">
          Pricing questions
        </h2>
        <div className="mt-6" id="faq">
          <FAQList items={PRICING_FAQ} />
        </div>
      </div>
    </div>
  );
}
