import type { Metadata } from "next";
import FAQList from "@/components/marketing/FAQList";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about EasyNote.",
};

const SECTIONS: { id: string; title: string; items: { q: string; a: string }[] }[] = [
  {
    id: "most-popular",
    title: "Most popular",
    items: [
      {
        q: "What is EasyNote?",
        a: "EasyNote is an AI note-taking assistant. Give it a live recording, an audio/video file, a YouTube link, a PDF, an image or pasted text, and it produces a transcript plus structured notes, a summary, key points, flashcards, quizzes, a mind map and a chat tutor grounded in that material.",
      },
      {
        q: "Which languages are supported?",
        a: "Notes are written in the language of your source content, and any note can be translated into 15+ languages — including Chinese, Spanish, French, German, Japanese, Korean and Arabic.",
      },
      {
        q: "How long does processing take?",
        a: "YouTube links and text are usually ready in under a minute. Uploaded audio depends on length — an hour-long lecture typically takes a few minutes to transcribe and summarize.",
      },
      {
        q: "Is my content private?",
        a: "Your notes belong to you. In this self-hosted build everything is stored locally on your own machine, and notes are only visible to others if you explicitly create a share link.",
      },
      {
        q: "Can I edit the AI's notes?",
        a: "Yes — open the Notes tab and hit Edit to change the Markdown directly. Your edits are saved to the note and included in exports.",
      },
    ],
  },
  {
    id: "record-notes",
    title: "Recording & importing",
    items: [
      {
        q: "How does live recording work?",
        a: "The Record page uses your browser's speech recognition to transcribe as you speak, while also saving the audio. When you stop, the transcript and recording become a note and the AI writes it up. Chrome or Edge are recommended for the best speech recognition.",
      },
      {
        q: "What file types can I upload?",
        a: "Audio: mp3, m4a, wav, aac, ogg, flac. Video: mp4, mov, webm, mkv. Documents: PDF. Images: png, jpg, gif, webp. Starter accounts can upload files up to 25 MB; Pro up to 200 MB.",
      },
      {
        q: "Why does my YouTube video fail to import?",
        a: "EasyNote reads the video's captions. If a video has captions disabled, is private, or is region-locked, there's nothing to read — try another video or download the audio and upload it instead.",
      },
      {
        q: "Do you support scanned PDFs?",
        a: "Yes. If a PDF has no embedded text, EasyNote falls back to AI vision to read the pages, so scanned textbooks and handouts still work.",
      },
      {
        q: "Can I jump from the notes back to the source?",
        a: "The Transcript tab is time-synced: click any paragraph to seek the attached audio or YouTube video to that exact moment. For PDFs, each block is labelled with its page number.",
      },
    ],
  },
  {
    id: "subscription",
    title: "Plans & billing",
    items: [
      {
        q: "What does the free Starter plan include?",
        a: "10 AI notes per month, all input types, flashcards, quizzes, mind maps, 30 chat messages a day, translation, sharing and export. No credit card required.",
      },
      {
        q: "How much is Pro?",
        a: "$19.99/month billed monthly, or $8.39/month when billed yearly ($100.68/year). Pro removes the note and chat limits, raises upload sizes to 200 MB and generates larger flashcard decks and quizzes.",
      },
      {
        q: "How do I cancel or downgrade?",
        a: "Open Settings → Plan and click Downgrade. In this demo build the change is instant and your notes are always kept.",
      },
      {
        q: "Is payment really processed in this build?",
        a: "No — this is a self-hosted demo. The checkout flow switches your local account between Starter and Pro without charging anything.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-center text-4xl font-extrabold tracking-tight text-slate-900">
        How can we help?
      </h1>
      <p className="mt-3 text-center text-slate-600">
        Quick answers about recording, importing, studying and billing.
      </p>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
          <h2 className="mb-4 text-xl font-bold text-slate-900">{s.title}</h2>
          <FAQList items={s.items} />
        </section>
      ))}
      <p className="mt-12 text-center text-sm text-slate-500">
        Still stuck? Write to{" "}
        <a
          href="mailto:support@easynote.local"
          className="font-medium text-brand-600 hover:underline"
        >
          support@easynote.local
        </a>
      </p>
    </div>
  );
}
