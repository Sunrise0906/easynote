import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>
      <div className="md-prose mt-8">
        <h2>1. The service</h2>
        <p>
          Recall provides AI-assisted note-taking: it transcribes and
          analyzes content you supply (recordings, files, links, images and
          text) and generates study materials such as notes, summaries,
          flashcards, quizzes, mind maps and chat responses. The service is
          provided for personal, educational and professional use.
        </p>

        <h2>2. Your account</h2>
        <p>
          You are responsible for keeping your credentials secure and for all
          activity under your account. Guest accounts are temporary and may be
          removed together with their content.
        </p>

        <h2>3. Your content</h2>
        <p>
          You keep all rights to the content you upload and to the notes
          generated from it. You grant Recall only the processing rights
          needed to operate the service (transcription, AI analysis, storage,
          and display back to you). Content is private unless you create a
          share link.
        </p>

        <h2>4. Acceptable use</h2>
        <ul>
          <li>
            Only upload content you have the right to use. Do not upload
            copyrighted lectures, courseware or media without permission from
            the rights holder.
          </li>
          <li>
            Respect your institution&apos;s policies — including rules about
            recording classes and academic integrity. Recall is a study aid,
            not a way around honest work.
          </li>
          <li>
            Do not use the service to generate or distribute unlawful, harmful
            or deceptive material, or attempt to disrupt or reverse-engineer
            the service.
          </li>
        </ul>

        <h2>5. Subscriptions</h2>
        <p>
          The Starter plan is free. Pro is offered as a monthly or yearly
          subscription and can be cancelled at any time from Settings; access
          continues until the end of the paid period. In this self-hosted demo
          build, plan changes are simulated and no payment is collected.
        </p>

        <h2>6. AI output</h2>
        <p>
          Generated notes and answers are produced by AI from your source
          material and may contain mistakes. Always verify important
          information against the original source — the transcript is kept
          attached to every note for exactly this reason.
        </p>

        <h2>7. Disclaimer & liability</h2>
        <p>
          The service is provided “as is” without warranties of any kind. To
          the maximum extent permitted by law, Recall is not liable for
          indirect or consequential damages arising from use of the service.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these terms; material changes will be announced in the
          app. Continued use after changes take effect constitutes acceptance.
        </p>
      </div>
    </div>
  );
}
