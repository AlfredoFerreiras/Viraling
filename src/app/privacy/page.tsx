import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";
import { getServerDict } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Política de Privacidad" };

const CONTACT = "info@frozensolutionsenterprises.com";

export default async function PrivacyPage() {
  const { lang } = await getServerDict();
  const es = lang === "es";

  const sections: { h: string; p: string[] }[] = es
    ? [
        {
          h: "1. Qué datos recopilamos",
          p: [
            "Cuenta: tu correo electrónico y datos de autenticación, gestionados por el propio Servicio (contraseña almacenada solo como hash bcrypt).",
            "Contenido: los nichos, respuestas del cuestionario de marca, transcripts que pegas y los guiones generados con tu cuenta.",
            "Uso: movimientos de tokens (para tu balance y auditoría) y datos técnicos básicos como dirección IP para límites de uso y seguridad.",
          ],
        },
        {
          h: "2. Para qué los usamos",
          p: [
            "Para operar el Servicio: autenticarte, generar tus guiones con IA, guardar tu historial, aplicar límites de uso y prevenir abuso. No vendemos tus datos personales a terceros ni los usamos para publicidad.",
          ],
        },
        {
          h: "3. Proveedores que procesan datos",
          p: [
            "Usamos proveedores de infraestructura estándar: Neon (base de datos), Anthropic (procesamiento de IA de los textos que envías a generar), Upstash (límites de uso), Cloudflare R2 (imágenes de referencia) y Vercel (hosting). Cada uno procesa solo lo necesario para su función.",
            "Los textos que envías al generador se procesan por el modelo de IA para producir tu guion; no se usan para entrenar modelos por parte del Servicio.",
          ],
        },
        {
          h: "4. Cookies",
          p: [
            "Usamos cookies estrictamente funcionales: sesión de autenticación, idioma de la interfaz y nicho activo. No usamos cookies de publicidad ni rastreadores de terceros.",
          ],
        },
        {
          h: "5. Retención y eliminación",
          p: [
            "Conservamos tus datos mientras tu cuenta exista. Si eliminas tu cuenta, tus datos de usuario, nichos y guiones se eliminan de nuestra base de datos. Puedes solicitar la eliminación escribiendo al contacto de abajo.",
          ],
        },
        {
          h: "6. Tus derechos",
          p: [
            "Puedes acceder, corregir o eliminar tus datos, y solicitar una copia de la información que tenemos sobre ti. Para ejercer estos derechos escribe al contacto de abajo y responderemos en un plazo razonable.",
          ],
        },
        {
          h: "7. Seguridad",
          p: [
            "Aplicamos medidas técnicas: cifrado en tránsito (HTTPS), aislamiento de datos por usuario a nivel de base de datos (Row Level Security), contraseñas con hash bcrypt y sesiones revocables y límites de uso por usuario e IP. Ningún sistema es 100% infalible, pero la seguridad es parte del diseño del Servicio.",
          ],
        },
        {
          h: "8. Menores",
          p: [
            "El Servicio no está dirigido a menores de 13 años. Si detectamos una cuenta de un menor, la eliminaremos.",
          ],
        },
        {
          h: "9. Cambios y contacto",
          p: [
            `Podemos actualizar esta política; los cambios relevantes se notificarán en la app. Contacto de privacidad: ${CONTACT}`,
          ],
        },
      ]
    : [
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
        {es ? "Política de Privacidad" : "Privacy Policy"}
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        {es ? "Última actualización" : "Last updated"}: 2026-07-22 ·{" "}
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
