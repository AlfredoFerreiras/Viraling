import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";
import { getServerDict } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Términos y Condiciones" };

const CONTACT = "info@frozensolutionsenterprises.com";

export default async function TermsPage() {
  const { lang } = await getServerDict();
  const es = lang === "es";

  const sections: { h: string; p: string[] }[] = es
    ? [
        {
          h: "1. Aceptación de los términos",
          p: [
            `Al crear una cuenta o usar ${APP_NAME} (el "Servicio") aceptas estos Términos y Condiciones. Si no estás de acuerdo, no uses el Servicio.`,
          ],
        },
        {
          h: "2. Descripción del servicio",
          p: [
            `${APP_NAME} genera guiones de contenido (reels, carruseles, stories) a partir de formatos virales y del perfil de marca que tú configuras, usando inteligencia artificial. El Servicio se ofrece "tal cual" y puede cambiar, mejorar o descontinuar funciones en cualquier momento.`,
          ],
        },
        {
          h: "3. Cuentas y seguridad",
          p: [
            "Debes proporcionar información veraz al registrarte y mantener la confidencialidad de tu cuenta. Eres responsable de toda actividad que ocurra bajo tu sesión. Podemos suspender cuentas que violen estos términos o hagan uso abusivo del Servicio.",
          ],
        },
        {
          h: "4. Planes, tokens y pagos",
          p: [
            "El Servicio funciona con un sistema de créditos (tokens) que se consumen al usar funciones de IA. El plan gratuito incluye una cantidad limitada de tokens al mes; los planes de pago incluyen más. Los tokens no son dinero, no son transferibles y no tienen valor fuera del Servicio. Los tokens de reset mensual no se acumulan.",
          ],
        },
        {
          h: "5. Contenido generado por IA",
          p: [
            "Los guiones se generan con modelos de inteligencia artificial y pueden contener errores o imprecisiones. Eres responsable de revisar y verificar el contenido antes de publicarlo. Tú conservas los derechos sobre el contenido que generes con tu cuenta y sobre el material que subas (transcripts, descripciones, datos de marca).",
            "No garantizamos resultados de alcance, views ni ventas derivados del uso de los guiones.",
          ],
        },
        {
          h: "6. Uso aceptable",
          p: [
            "No puedes usar el Servicio para generar contenido ilegal, difamatorio, discriminatorio, engañoso o que infrinja derechos de terceros; ni intentar vulnerar la seguridad, hacer scraping masivo, revender el acceso o eludir los límites de uso. El incumplimiento puede resultar en suspensión inmediata sin reembolso.",
          ],
        },
        {
          h: "7. Propiedad intelectual",
          p: [
            `El software, el diseño, la marca y la biblioteca de formatos de ${APP_NAME} son propiedad del Servicio o de sus licenciantes. Estos términos no te transfieren ningún derecho sobre ellos, salvo la licencia limitada de uso de la plataforma.`,
          ],
        },
        {
          h: "8. Limitación de responsabilidad",
          p: [
            "En la medida máxima permitida por la ley, el Servicio no será responsable por daños indirectos, pérdida de datos, lucro cesante o perjuicios derivados del uso o imposibilidad de uso de la plataforma. Nuestra responsabilidad total se limita al monto pagado por ti en los últimos 3 meses.",
          ],
        },
        {
          h: "9. Terminación",
          p: [
            "Puedes eliminar tu cuenta en cualquier momento. Podemos terminar o suspender el acceso por violación de estos términos. Las secciones que por su naturaleza deban sobrevivir (propiedad intelectual, limitación de responsabilidad) seguirán vigentes.",
          ],
        },
        {
          h: "10. Cambios y contacto",
          p: [
            `Podemos actualizar estos términos; si el cambio es relevante lo notificaremos en la app. El uso continuado tras el cambio implica aceptación. Contacto: ${CONTACT}`,
          ],
        },
      ]
    : [
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
        {es ? "Términos y Condiciones" : "Terms & Conditions"}
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        {es ? "Última actualización" : "Last updated"}: 2026-07-22
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
