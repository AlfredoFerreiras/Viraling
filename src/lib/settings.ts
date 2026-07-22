import { eq } from "drizzle-orm";
import { withServiceContext } from "@/db/context";
import { appSettings } from "@/db/schema";

const AI_ENABLED_KEY = "ai_enabled";

/**
 * Kill switch (sección 7.3.7): flag en DB. Si está apagado, los endpoints
 * de IA responden 503 con mensaje de mantenimiento. Por defecto: encendido.
 */
export async function isAiEnabled(): Promise<boolean> {
  const [row] = await withServiceContext((tx) =>
    tx
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, AI_ENABLED_KEY))
      .limit(1),
  );
  if (!row) return true;
  return row.value !== false && (row.value as { enabled?: boolean })?.enabled !== false;
}

export async function setAiEnabled(enabled: boolean): Promise<void> {
  await withServiceContext((tx) =>
    tx
      .insert(appSettings)
      .values({ key: AI_ENABLED_KEY, value: { enabled }, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: { enabled }, updatedAt: new Date() },
      }),
  );
}
