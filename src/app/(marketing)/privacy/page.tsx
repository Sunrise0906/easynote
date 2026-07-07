import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: July 2026</p>
      <div className="md-prose mt-8">
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Account data</strong> — your email, display name and a
            salted hash of your password (never the password itself).
          </li>
          <li>
            <strong>Your content</strong> — uploaded files, transcripts, and
            the notes, flashcards, quizzes and chat history generated from
            them.
          </li>
          <li>
            <strong>Usage counters</strong> — how many notes and chat messages
            you&apos;ve used this period, to enforce plan limits.
          </li>
        </ul>
        <p>
          In this self-hosted build, all of the above lives in the{" "}
          <code>data/</code> directory on the machine running the app — nothing
          is sent to us.
        </p>

        <h2>How AI processing works</h2>
        <p>
          To generate transcripts and notes, your content is sent to the AI
          providers configured by the operator of this deployment (for
          example Anthropic for note generation, and an optional
          speech-to-text provider for uploaded audio). Content is sent solely
          to produce your requested output.
        </p>

        <h2>Sharing</h2>
        <p>
          Notes are private by default. Creating a share link publishes a
          read-only copy at an unguessable URL; deleting the link revokes
          access immediately.
        </p>

        <h2>Your controls</h2>
        <ul>
          <li>Export any note as Markdown, text or JSON at any time.</li>
          <li>Delete notes individually — media files are removed with them.</li>
          <li>
            Delete your account from Settings to remove your profile and all
            notes.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use a single session cookie to keep you signed in. No advertising
          or cross-site tracking cookies are set.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach us at <code>privacy@easynote.local</code>.
        </p>
      </div>
    </div>
  );
}
