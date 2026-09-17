/**
 * Sets (or creates) a user password by email. If the user does not
 * exist, it is created with the schema defaults (role user, plan free,
 * 3 credits). Closes all of their open sessions.
 *
 * Usage: npm run user:set-password -- someone@example.com "a password"
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
    console.error("The password must be at least 8 characters long");
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
      ? `User ${email} created with a password (${result.id})`
      : `Password updated for ${email} (${result.id}), sessions closed`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
