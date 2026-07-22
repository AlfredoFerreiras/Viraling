import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { withServiceContext } from "@/db/context";
import { users } from "@/db/schema";

/**
 * Webhook de Clerk: mantiene la tabla users como espejo.
 * Clerk es la fuente de verdad de auth; la DB guarda rol, plan y tokens.
 * La firma se verifica con CLERK_WEBHOOK_SIGNING_SECRET (svix) antes de
 * tocar nada. Los defaults del schema aplican: role user, plan free,
 * tokens_balance 3.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Firma de webhook inválida", { status: 400 });
  }

  switch (evt.type) {
    case "user.created": {
      const email = evt.data.email_addresses?.[0]?.email_address ?? "";
      await withServiceContext((tx) =>
        tx
          .insert(users)
          .values({ clerkId: evt.data.id, email })
          .onConflictDoNothing({ target: users.clerkId }),
      );
      break;
    }
    case "user.updated": {
      const email = evt.data.email_addresses?.[0]?.email_address;
      if (email) {
        await withServiceContext((tx) =>
          tx
            .update(users)
            .set({ email })
            .where(eq(users.clerkId, evt.data.id)),
        );
      }
      break;
    }
    case "user.deleted": {
      if (evt.data.id) {
        const clerkId = evt.data.id;
        await withServiceContext((tx) =>
          tx.delete(users).where(eq(users.clerkId, clerkId)),
        );
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
