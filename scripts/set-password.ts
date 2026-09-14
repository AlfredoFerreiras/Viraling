/**
 * Fija (o crea) la contraseña de un usuario por email. Si el usuario no
 * existe, lo crea con los defaults del schema (role user, plan free,
 * 3 créditos). Cierra todas sus sesiones abiertas.
 *
 * Uso: npm run user:set-password -- correo@ejemplo.com "contraseña"
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function main() {
  const [rawEmail, password] = process.argv.slice(2);
  if (!rawEmail || !password) {
    console.error('Uso: npm run user:set-password -- <email> "<password>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres");
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();

  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withServiceContext } = await import("../src/db/context");
  const { sessions, users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { eq } = await import("drizzle-orm");

  const passwordHash = await hashPassword(password);

  const result = await withServiceContext(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, existing.id));
      await tx.delete(sessions).where(eq(sessions.userId, existing.id));
      return { id: existing.id, created: false };
    }

    const [created] = await tx
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id });
    return { id: created.id, created: true };
  });

  console.log(
    result.created
      ? `Usuario ${email} creado con contraseña (${result.id})`
      : `Contraseña actualizada para ${email} (${result.id}), sesiones cerradas`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
