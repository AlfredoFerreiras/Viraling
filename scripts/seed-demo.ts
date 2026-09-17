/**
 * Prepares a shared demo account for portfolio visitors.
 *
 * Requirement: the account exists (create it with
 * npm run user:set-password -- email password). Then this script:
 *  1. Upgrades the plan to pro.
 *  2. Sets the credit balance to the given amount (default 60), recording
 *     the movement in the ledger.
 *  3. Creates a sample niche with a full brand voice if the account has
 *     none, so it lands directly on the dashboard.
 *  4. Inserts one reel, one carousel and one story so History and the
 *     script pages are populated for a visitor. Written by hand, so
 *     seeding never spends Anthropic credits.
 *
 * Idempotent: run it again to "recharge" the demo.
 *
 * Usage: npm run db:seed-demo -- demo@example.com [credits]
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { DEMO_SCRIPTS } from "./demo-content";

const DEMO_NICHE = {
  name: "Credit repair coaching",
  language: "en",
  audience: "People in the US with a low credit score who want to buy a home or a car",
  offer: "90-day credit repair program with 1 on 1 coaching",
  ctaWord: "CREDIT",
  brandVoice: {
    sells: "90-day credit repair program with 1 on 1 coaching",
    ideal_client:
      "Adults in the US between 25 and 45, score between 450 and 620, tired of getting denied",
    transformation:
      "From a 500 score and bank rejections to 700+ and approved for a home or a car",
    tone: "warm, direct, no jargon, like a friend who knows the topic",
    never_say: "guaranteed, miracle, we erase your history, easy money",
    cta_word: "CREDIT",
    success_cases:
      "Over 300 clients, average +120 points in 90 days, Maria went from 480 to 715 in 4 months",
    recordings_per_week: 3,
  },
};

async function main() {
  const [email, tokensArg] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npm run db:seed-demo -- <email> [credits]");
    process.exit(1);
  }
  const targetTokens = Number(tokensArg ?? 60);
  if (!Number.isInteger(targetTokens) || targetTokens < 0) {
    console.error("credits must be an integer >= 0");
    process.exit(1);
  }

  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withServiceContext } = await import("../src/db/context");
  const { formats, niches, scripts, users } = await import("../src/db/schema");
  const { adminAdjustTokens } = await import("../src/lib/tokens");
  const { eq } = await import("drizzle-orm");

  const [user] = await withServiceContext((tx) =>
    tx.select().from(users).where(eq(users.email, email)).limit(1),
  );
  if (!user) {
    console.error(
      `${email} does not exist in the users table. Create the account in the app and sign in once first.`,
    );
    process.exit(1);
  }

  if (user.plan !== "pro") {
    await withServiceContext((tx) =>
      tx.update(users).set({ plan: "pro" }).where(eq(users.id, user.id)),
    );
    console.log("  plan -> pro");
  }

  const delta = targetTokens - user.tokensBalance;
  if (delta !== 0) {
    const { newBalance } = await adminAdjustTokens(
      user.id,
      delta,
      "demo account recharge",
    );
    console.log(`  credits ${user.tokensBalance} -> ${newBalance}`);
  } else {
    console.log(`  credits already at ${targetTokens}`);
  }

  const existing = await withServiceContext((tx) =>
    tx.select({ id: niches.id }).from(niches).where(eq(niches.userId, user.id)).limit(1),
  );
  if (existing.length === 0) {
    await withServiceContext((tx) =>
      tx.insert(niches).values({ userId: user.id, ...DEMO_NICHE }),
    );
    console.log(`  niche created: ${DEMO_NICHE.name}`);
  } else {
    console.log("  account already has niches, sample niche not created");
  }

  // Sample scripts, so History and the script pages are never empty.
  const [nicheRow] = await withServiceContext((tx) =>
    tx.select({ id: niches.id }).from(niches).where(eq(niches.userId, user.id)).limit(1),
  );
  const existingScripts = await withServiceContext((tx) =>
    tx.select({ id: scripts.id }).from(scripts).where(eq(scripts.userId, user.id)).limit(1),
  );

  if (!nicheRow) {
    console.log("  no niche to attach sample scripts to, skipped");
  } else if (existingScripts.length > 0) {
    console.log("  account already has scripts, samples not created");
  } else {
    const globalFormats = await withServiceContext((tx) =>
      tx
        .select({ id: formats.id, contentType: formats.contentType })
        .from(formats)
        .where(eq(formats.ownerScope, "global")),
    );

    let created = 0;
    for (const demo of DEMO_SCRIPTS) {
      const format = globalFormats.find((f) => f.contentType === demo.contentType);
      if (!format) {
        console.log(`  no global ${demo.contentType} format, skipped "${demo.title}"`);
        continue;
      }
      await withServiceContext((tx) =>
        tx.insert(scripts).values({
          userId: user.id,
          nicheId: nicheRow.id,
          formatId: format.id,
          contentType: demo.contentType,
          title: demo.title,
          sections: demo.sections,
          covers: demo.covers,
          caption: demo.caption,
          hashtags: demo.hashtags,
        }),
      );
      created += 1;
    }
    console.log(`  sample scripts created: ${created}`);
  }

  console.log("\nDemo ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
