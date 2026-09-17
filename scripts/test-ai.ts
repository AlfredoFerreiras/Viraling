/**
 * Smoke test for the AI flow (block 5): makes a real call to Claude with a
 * short transcript and checks the output matches the skeleton schema.
 * Cuesta centavos. Uso: npm run test:ai
 * (requires --conditions=react-server because of the server-only guard)
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function main() {
  const { callClaudeJson, wrapUserData } = await import("../src/lib/ai/claude");
  const { EXTRACTOR_SYSTEM } = await import("../src/lib/ai/prompts");
  const { skeletonOutput } = await import("../src/lib/validations/ai");

  const transcript = `These are the 3 mistakes keeping your credit score on the floor.
Mistake number one: paying late. Even one day late and the report reaches the bureau.
Mistake number two: using more than 30% of your limit. Utilization is 30% of your score.
Mistake number three: closing old cards. Your average account age drops all at once.
If you want help cleaning up your credit, comment the word CREDIT and I will send you the guide.`;

  console.log("Llamando a Claude (extractor de formatos)...");
  const skeleton = await callClaudeJson({
    system: EXTRACTOR_SYSTEM,
    user: wrapUserData("transcript", transcript) + "\n\nTipo de contenido: reel",
    schema: skeletonOutput,
  });

  console.log("\nSkeleton extracted and validated with Zod:");
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
