/**
 * Smoke test del flujo de IA (bloque 5): llama a Claude de verdad con un
 * transcript corto y valida que la salida cumple el schema del skeleton.
 * Cuesta centavos. Uso: npm run test:ai
 * (requiere --conditions=react-server por el guard de server-only)
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function main() {
  const { callClaudeJson, wrapUserData } = await import("../src/lib/ai/claude");
  const { EXTRACTOR_SYSTEM } = await import("../src/lib/ai/prompts");
  const { skeletonOutput } = await import("../src/lib/validations/ai");

  const transcript = `Estos son los 3 errores que te tienen el credit score en el piso.
Error número uno: pagar tarde. Aunque sea un día tarde, el reporte llega al bureau.
Error número dos: usar más del 30% de tu límite. La utilización pesa el 30% de tu score.
Error número tres: cerrar tarjetas viejas. La antigüedad promedio se te cae de golpe.
Si quieres que te ayude a limpiar tu crédito, comenta la palabra CREDITO y te mando la guía.`;

  console.log("Llamando a Claude (extractor de formatos)...");
  const skeleton = await callClaudeJson({
    system: EXTRACTOR_SYSTEM,
    user: wrapUserData("transcript", transcript) + "\n\nTipo de contenido: reel",
    schema: skeletonOutput,
  });

  console.log("\nSkeleton extraído y validado con Zod:");
  console.log(`  name: ${skeleton.name}`);
  console.log(`  hook_type: ${skeleton.hook_type}`);
  console.log(`  secciones: ${skeleton.structure.map((s) => s.section).join(" -> ")}`);
  console.log(`  reglas replicables: ${skeleton.replicable_rules.length}`);
  console.log("\nSMOKE TEST OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
