import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms & Conditions" };

const CONTACT = "info@frozensolutionsenterprises.com";

export default async function TermsPage() {

  const sections: { h: string; p: string[] }[] = [
      {
        h: "1. Acceptance of terms",
        p: [
          `By creating an account or using ${APP_NAME} (the "Service") you accept these Terms & Conditions. If you don't agree, do not use the Service.`,
        ],
      },
      {
        h: "2. Service description",
        p: [
          `${APP_NAME} generates content scripts (reels, carousels, stories) from viral formats and the brand profile you configure, using artificial intelligence. The Service is provided "as is" and features may change, improve or be discontinued at any time.`,
        ],
      },
      {
        h: "3. Accounts and security",
        p: [
          "You must provide accurate information when signing up and keep your account confidential. You are responsible for all activity under your session. We may suspend accounts that violate these terms or abuse the Service.",
        ],
      },
      {
        h: "4. Plans, tokens and payments",
        p: [
          "The Service works with a credit system (tokens) consumed by AI features. The free plan includes a limited amount of tokens per month; paid plans include more. Tokens are not money, are not transferable and have no value outside the Service. Monthly reset tokens do not accumulate.",
        ],
      },
      {
        h: "5. AI-generated content",
        p: [
          "Scripts are generated with AI models and may contain errors or inaccuracies. You are responsible for reviewing and verifying content before publishing it. You keep the rights over the content you generate with your account and the material you upload (transcripts, descriptions, brand data).",
          "We do not guarantee reach, views or sales derived from using the scripts.",
        ],
      },
      {
        h: "6. Acceptable use",
        p: [
          "You may not use the Service to generate illegal, defamatory, discriminatory, deceptive content or content that infringes third-party rights; nor attempt to breach security, mass-scrape, resell access or evade usage limits. Violations may result in immediate suspension without refund.",
        ],
      },
      {
        h: "7. Intellectual property",
        p: [
          `The software, design, brand and format library of ${APP_NAME} belong to the Service or its licensors. These terms do not transfer any rights over them, except the limited license to use the platform.`,
        ],
      },
      {
        h: "8. Limitation of liability",
        p: [
          "To the maximum extent permitted by law, the Service shall not be liable for indirect damages, data loss, lost profits or damages derived from the use or inability to use the platform. Our total liability is limited to the amount you paid in the last 3 months.",
        ],
      },
      {
        h: "9. Termination",
        p: [
          "You may delete your account at any time. We may terminate or suspend access for violation of these terms. Sections that by their nature should survive (intellectual property, limitation of liability) remain in force.",
        ],
      },
      {
        h: "10. Changes and contact",
        p: [
          `We may update these terms; if the change is relevant we will notify you in the app. Continued use after a change implies acceptance. Contact: ${CONTACT}`,
        ],
      },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        {"Terms & Conditions"}
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        {"Last updated"}: 2026-07-22
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
