/**
 * Seed for the global format library.
 *
 * Inserts a starter set of viral formats (reel, carousel, story) with
 * hand-written skeletons, validated against the same Zod schema the AI
 * extractor uses. Idempotent: a global format with the same name and
 * content type is skipped.
 *
 * Usage: npm run db:seed
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { skeletonOutput, type SkeletonOutput } from "../src/lib/validations/ai";

type Seed = {
  name: string;
  contentType: "reel" | "carousel" | "story";
  skeleton: SkeletonOutput;
  performanceNotes: string;
};

const SEEDS: Seed[] = [
  {
    name: "Works / Doesn't work",
    contentType: "reel",
    performanceNotes:
      "Binary contrast that forces viewers to stay until the end to see what actually works. Very strong in service and education niches.",
    skeleton: {
      name: "Works / Doesn't work",
      structure: [
        {
          section: "hook",
          purpose: "Name the common mistake the audience is making right now",
          relative_duration: "0 to 3 seconds",
        },
        {
          section: "context",
          purpose: "Explain why almost everyone does the thing that does NOT work",
          relative_duration: "3 to 10 seconds",
        },
        {
          section: "problem",
          purpose: "Show the concrete consequence of keeping the bad habit",
          relative_duration: "10 to 18 seconds",
        },
        {
          section: "solution",
          purpose: "Reveal what DOES work with one actionable step",
          relative_duration: "18 to 30 seconds",
        },
        {
          section: "cta",
          purpose: "Ask for the keyword in the comments to receive the resource",
          relative_duration: "30 to 35 seconds",
        },
      ],
      hook_type: "Common mistake ('Stop doing X if you want Y')",
      pacing: "Fast, short sentences, a cut every 2 to 3 seconds",
      visual_elements: [
        "On-screen text with a red ✗ for what doesn't work",
        "On-screen text with a green ✓ for what does",
        "Zoom in on the reveal of the solution",
      ],
      cta_type: "Keyword comment",
      replicable_rules: [
        "The hook always names a behavior the audience recognizes as their own",
        "Never reveal the solution before second 18",
        "Exactly one actionable tip in the solution, never a list",
        "The CTA asks for a specific word, not 'follow me'",
      ],
    },
  },
  {
    name: "Tier List",
    contentType: "reel",
    performanceNotes:
      "Ranks the niche's options from worst to best. Drives comments because the audience argues about the order.",
    skeleton: {
      name: "Tier List",
      structure: [
        {
          section: "hook",
          purpose: "Announce that the most popular options in the niche are about to be ranked",
          relative_duration: "0 to 3 seconds",
        },
        {
          section: "context",
          purpose: "State the ranking criterion in one sentence",
          relative_duration: "3 to 7 seconds",
        },
        {
          section: "problem",
          purpose: "Rank the weak or overrated options (tiers C and B)",
          relative_duration: "7 to 20 seconds",
        },
        {
          section: "solution",
          purpose: "Reveal the S tier option and why",
          relative_duration: "20 to 32 seconds",
        },
        {
          section: "cta",
          purpose: "Ask which tier they disagree with and offer the full guide",
          relative_duration: "32 to 38 seconds",
        },
      ],
      hook_type: "Ranking promise ('I ranked every X and here is what I found')",
      pacing: "Medium, one option every 3 to 4 seconds, speeding up toward S tier",
      visual_elements: [
        "Tier table on screen that fills in as you go",
        "Letters S, A, B, C in colors",
        "Each option appears as a card when named",
      ],
      cta_type: "Open question + keyword",
      replicable_rules: [
        "Minimum 4 options, maximum 7",
        "Put at least one popular option in a low tier to spark debate",
        "S tier always comes last and is justified with a fact",
        "The ranking criterion is stated explicitly",
      ],
    },
  },
  {
    name: "Client story before / after",
    contentType: "reel",
    performanceNotes:
      "A real case with concrete numbers. Converts well because the social proof is specific.",
    skeleton: {
      name: "Client story before / after",
      structure: [
        {
          section: "hook",
          purpose: "State the final result with a number and a timeframe ('X went from A to B in N days')",
          relative_duration: "0 to 3 seconds",
        },
        {
          section: "context",
          purpose: "Introduce the client and a starting situation the audience identifies with",
          relative_duration: "3 to 10 seconds",
        },
        {
          section: "problem",
          purpose: "What they had tried before and why it failed",
          relative_duration: "10 to 17 seconds",
        },
        {
          section: "solution",
          purpose: "The 2 or 3 concrete changes that made the difference",
          relative_duration: "17 to 30 seconds",
        },
        {
          section: "cta",
          purpose: "Invite anyone in the starting situation to comment the keyword",
          relative_duration: "30 to 35 seconds",
        },
      ],
      hook_type: "Result with a number ('From 480 to 720 in 90 days')",
      pacing: "Narrative, slow in the before, faster in the solution",
      visual_elements: [
        "Before and after numbers on screen, large",
        "Screenshot or testimonial from the client (with permission)",
        "The changes listed as bullets that appear one by one",
      ],
      cta_type: "Identification + keyword",
      replicable_rules: [
        "The hook always carries a starting number, an ending number and a timeframe",
        "The client must read as 'someone like me'",
        "Never promise the same result, show the process",
        "Maximum 3 changes in the solution",
      ],
    },
  },
  {
    name: "5 mistakes costing you",
    contentType: "carousel",
    performanceNotes:
      "Mistake per slide with the fix on the same slide. High save rate because it works as a checklist.",
    skeleton: {
      name: "5 mistakes costing you",
      structure: [
        {
          section: "cover",
          purpose: "Title with the number of mistakes and what they cost (money, time, clients)",
          relative_duration: "slide 1",
        },
        {
          section: "hook",
          purpose: "Claim that most people make at least 3 of these without knowing",
          relative_duration: "slide 2",
        },
        {
          section: "mistakes",
          purpose: "One mistake per slide: name it, why it hurts, what to do instead",
          relative_duration: "slides 3 to 7",
        },
        {
          section: "summary",
          purpose: "Checklist of all 5 on a single slide so people save it",
          relative_duration: "slide 8",
        },
        {
          section: "cta",
          purpose: "Ask to save and comment the keyword for the full version",
          relative_duration: "slide 9",
        },
      ],
      hook_type: "Number + loss ('5 mistakes costing you clients')",
      pacing: "One concept per slide, maximum 25 words per slide",
      visual_elements: [
        "Large mistake number on each slide",
        "✗ icon on the mistake and ✓ on the fix",
        "Summary slide with checkboxes",
      ],
      cta_type: "Save + keyword comment",
      replicable_rules: [
        "Exactly 5 mistakes, no more, no less",
        "Every mistake carries its fix on the same slide",
        "The summary slide is mandatory: it is what gets saved",
        "The cover has at most 8 words",
      ],
    },
  },
  {
    name: "Myth vs reality",
    contentType: "carousel",
    performanceNotes:
      "Debunks beliefs in the niche. Drives comments from people defending the myth.",
    skeleton: {
      name: "Myth vs reality",
      structure: [
        {
          section: "cover",
          purpose: "State the most popular myth in the niche as if it were true",
          relative_duration: "slide 1",
        },
        {
          section: "twist",
          purpose: "Say it is false and that there are more myths like it",
          relative_duration: "slide 2",
        },
        {
          section: "myths",
          purpose: "One myth per slide: the myth large, the reality below with a fact",
          relative_duration: "slides 3 to 8",
        },
        {
          section: "cta",
          purpose: "Ask which one they believed and offer the resource with the keyword",
          relative_duration: "slide 9",
        },
      ],
      hook_type: "False statement presented as truth",
      pacing: "Myth on top, reality below, same layout on every slide",
      visual_elements: [
        "Myth crossed out at the top of the slide",
        "Reality in the brand color below",
        "One data point or figure per slide",
      ],
      cta_type: "Question + keyword",
      replicable_rules: [
        "The cover myth has to be one the audience actually believes",
        "Every reality carries a fact, not just an opinion",
        "Between 4 and 6 myths",
        "Never mock the people who believe the myth",
      ],
    },
  },
  {
    name: "4-story sales sequence",
    contentType: "story",
    performanceNotes:
      "The classic selling sequence: connect, prove, show, ask. Meant to be posted the same day.",
    skeleton: {
      name: "4-story sales sequence",
      structure: [
        {
          section: "connection",
          purpose: "Share something personal or from daily life that connects with the audience's pain",
          relative_duration: "story 1",
        },
        {
          section: "proof",
          purpose: "Show a result, testimonial or screenshot that proves it works",
          relative_duration: "story 2",
        },
        {
          section: "product",
          purpose: "Explain what the offer is and who it is for, in 2 sentences",
          relative_duration: "story 3",
        },
        {
          section: "cta",
          purpose: "Ask for a single action: reply to the story, sticker or link",
          relative_duration: "story 4",
        },
      ],
      hook_type: "Personal confession or everyday moment",
      pacing: "One idea per story, short text, face to camera or a screenshot",
      visual_elements: [
        "Story 1 face to camera, no production",
        "Story 2 screenshot of a result or testimonial",
        "Story 4 with a question sticker or link",
      ],
      cta_type: "Direct reply to the story",
      replicable_rules: [
        "The first story never sells",
        "The proof has to be real and specific",
        "A single CTA in the last story",
        "The whole sequence goes out in the same time block",
      ],
    },
  },
  {
    name: "Follower question",
    contentType: "story",
    performanceNotes:
      "Answer a real (or frequent) question from the audience. Generates more questions and DM conversations.",
    skeleton: {
      name: "Follower question",
      structure: [
        {
          section: "connection",
          purpose: "Show the question received (screenshot or sticker) and say it is very common",
          relative_duration: "story 1",
        },
        {
          section: "proof",
          purpose: "Answer with your own experience or a client's",
          relative_duration: "story 2",
        },
        {
          section: "product",
          purpose: "Mention that this is part of what the offer works on",
          relative_duration: "story 3",
        },
        {
          section: "cta",
          purpose: "Open a question sticker for the next round",
          relative_duration: "story 4",
        },
      ],
      hook_type: "Real question from the audience",
      pacing: "Conversational, like a direct reply",
      visual_elements: [
        "Screenshot of the question with the name covered",
        "Face to camera answering",
        "Question sticker at the end",
      ],
      cta_type: "Question sticker",
      replicable_rules: [
        "The question is shown verbatim, not paraphrased",
        "The answer delivers full value, not half",
        "The offer mention is one sentence, no pressure",
        "Always close by asking for more questions",
      ],
    },
  },
];

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withServiceContext } = await import("../src/db/context");
  const { formats } = await import("../src/db/schema");
  const { and, eq } = await import("drizzle-orm");

  let inserted = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const parsed = skeletonOutput.safeParse(seed.skeleton);
    if (!parsed.success) {
      throw new Error(
        `Invalid skeleton for "${seed.name}": ${JSON.stringify(parsed.error.issues)}`,
      );
    }

    const done = await withServiceContext(async (tx) => {
      const [existing] = await tx
        .select({ id: formats.id })
        .from(formats)
        .where(
          and(
            eq(formats.ownerScope, "global"),
            eq(formats.name, seed.name),
            eq(formats.contentType, seed.contentType),
          ),
        )
        .limit(1);
      if (existing) return false;

      await tx.insert(formats).values({
        ownerScope: "global",
        userId: null,
        name: seed.name,
        contentType: seed.contentType,
        skeleton: parsed.data,
        performanceNotes: seed.performanceNotes,
        status: "active",
      });
      return true;
    });

    if (done) {
      inserted += 1;
      console.log(`  + ${seed.name} [${seed.contentType}]`);
    } else {
      skipped += 1;
      console.log(`  = ${seed.name} [${seed.contentType}] (already exists)`);
    }
  }

  console.log(`\nSeed done: ${inserted} inserted, ${skipped} already existed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
