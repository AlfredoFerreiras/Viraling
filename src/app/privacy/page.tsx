import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy" };

const CONTACT = "info@frozensolutionsenterprises.com";

export default async function PrivacyPage() {

  const sections: { h: string; p: string[] }[] = [
      {
        h: "1. What data we collect",
        p: [
          "Account: your email and authentication data, managed by the Service itself (password stored only as a bcrypt hash).",
          "Content: your niches, brand questionnaire answers, transcripts you paste and the scripts generated with your account.",
          "Usage: token movements (for your balance and auditing) and basic technical data such as IP address for rate limiting and security.",
        ],
      },
      {
        h: "2. How we use it",
        p: [
          "To operate the Service: authenticate you, generate your scripts with AI, store your history, apply usage limits and prevent abuse. We do not sell your personal data to third parties nor use it for advertising.",
        ],
      },
      {
        h: "3. Processors",
        p: [
          "We use standard infrastructure providers: Neon (database), Anthropic (AI processing of the texts you submit for generation), Upstash (rate limiting), Cloudflare R2 (reference images) and Vercel (hosting). Each processes only what's needed for its function.",
          "Texts you submit to the generator are processed by the AI model to produce your script; the Service does not use them to train models.",
        ],
      },
      {
        h: "4. Cookies",
        p: [
          "We use strictly functional cookies: authentication session, interface language and active niche. No advertising cookies or third-party trackers.",
        ],
      },
      {
        h: "5. Retention and deletion",
        p: [
          "We keep your data while your account exists. If you delete your account, your user data, niches and scripts are removed from our database. You can request deletion by writing to the contact below.",
        ],
      },
      {
        h: "6. Your rights",
        p: [
          "You can access, correct or delete your data, and request a copy of the information we hold about you. To exercise these rights write to the contact below and we will respond within a reasonable time.",
        ],
      },
      {
        h: "7. Security",
        p: [
          "We apply technical measures: encryption in transit (HTTPS), per-user data isolation at the database level (Row Level Security), bcrypt-hashed passwords and revocable sessions and per-user/IP rate limits. No system is 100% infallible, but security is part of the Service's design.",
        ],
      },
      {
        h: "8. Children",
        p: [
          "The Service is not directed at children under 13. If we detect a minor's account, we will delete it.",
        ],
      },
      {
        h: "9. Changes and contact",
        p: [
          `We may update this policy; relevant changes will be notified in the app. Privacy contact: ${CONTACT}`,
        ],
      },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        {"Privacy Policy"}
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        {"Last updated"}: 2026-07-22 ·{" "}
        {APP_NAME}
      </p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-2 text-lg font-semibold">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mb-2 text-sm leading-relaxed text-zinc-300">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
