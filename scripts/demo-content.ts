/**
 * Sample generated content for the shared demo account.
 *
 * These are written by hand rather than generated, on purpose: seeding must
 * not spend Anthropic credits, and a demo visitor should always land on the
 * same populated History and script pages. The shapes here match the Zod
 * output schemas in src/lib/validations/ai.ts exactly.
 */

export type DemoScript = {
  contentType: "reel" | "carousel" | "story";
  title: string;
  sections: unknown;
  covers: unknown;
  caption: string;
  hashtags: string[];
};

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    contentType: "reel",
    title: "3 mistakes keeping your score under 600",
    sections: [
      {
        section: "hook",
        time_start: 0,
        time_end: 3,
        spoken:
          "If your score is stuck under 600, it is almost never the reason you think.",
        on_screen: ["STUCK UNDER 600?", "it is not what you think"],
      },
      {
        section: "context",
        time_start: 3,
        time_end: 9,
        spoken:
          "I have walked more than 300 people through this, and the same three mistakes come up every single time.",
        on_screen: ["300+ clients", "same 3 mistakes"],
      },
      {
        section: "problem",
        time_start: 9,
        time_end: 20,
        spoken:
          "One, paying late even by a day. Two, using more than 30 percent of your limit. Three, closing your oldest card, which drops your average account age overnight.",
        on_screen: ["1. late by a day", "2. over 30% usage", "3. closing old cards"],
      },
      {
        section: "solution",
        time_start: 20,
        time_end: 32,
        spoken:
          "Set autopay for the minimum so nothing is ever late, keep every card under 30 percent, and never close your oldest account. Maria did exactly this and went from 480 to 715 in four months.",
        on_screen: ["autopay the minimum", "stay under 30%", "480 to 715"],
      },
      {
        section: "cta",
        time_start: 32,
        time_end: 38,
        spoken:
          "Comment the word CREDIT and I will send you the checklist I use with my own clients.",
        on_screen: ["comment CREDIT", "free checklist"],
      },
    ],
    covers: [
      { white_text: "3 mistakes keeping your score", yellow_text: "under 600" },
      { white_text: "She went from 480 to", yellow_text: "715 in 4 months" },
      { white_text: "Stop closing your", yellow_text: "oldest credit card" },
    ],
    caption:
      "Most people fight the wrong battle with their credit. Fix these three and the score moves on its own. Comment CREDIT for the checklist.",
    hashtags: ["#creditrepair", "#creditscore", "#creditcoach", "#financialliteracy", "#homebuying"],
  },
  {
    contentType: "carousel",
    title: "The 90-day credit reset, slide by slide",
    sections: [
      {
        slide: 1,
        title: "The 90-day credit reset",
        body: "What I run with every client who comes in under 620.",
        is_cta: false,
      },
      {
        slide: 2,
        title: "Day 1: pull all three reports",
        body: "Experian, Equifax and TransUnion do not carry the same data. Working from one report is how people miss the error that is costing them 40 points.",
        is_cta: false,
      },
      {
        slide: 3,
        title: "Day 3: mark every error",
        body: "Wrong balances, accounts that are not yours, late payments you actually made on time. Write down the account number and the exact line.",
        is_cta: false,
      },
      {
        slide: 4,
        title: "Day 7: dispute in writing",
        body: "Mail beats the online portal. You get a paper trail and the 30-day clock starts the day they sign for it.",
        is_cta: false,
      },
      {
        slide: 5,
        title: "Day 14: drop your usage",
        body: "Get every card under 30 percent, and your biggest one under 10. This is the fastest legal move on the board.",
        is_cta: false,
      },
      {
        slide: 6,
        title: "Day 30: autopay everything",
        body: "Minimum payment on autopay for every account. One late payment undoes three months of work.",
        is_cta: false,
      },
      {
        slide: 7,
        title: "Day 60: check what moved",
        body: "Pull the reports again. Anything still wrong gets a second dispute, this time citing the first one.",
        is_cta: false,
      },
      {
        slide: 8,
        title: "Day 90: the number",
        body: "Average client lands +120 points. Maria went from 480 to 715 and closed on her house.",
        is_cta: false,
      },
      {
        slide: 9,
        title: "Want the templates?",
        body: "Comment CREDIT and I will send you the dispute letters and the tracker I use with clients.",
        is_cta: true,
      },
    ],
    covers: [
      { white_text: "The 90-day", yellow_text: "credit reset" },
      { white_text: "From 480 to", yellow_text: "715 in 90 days" },
      { white_text: "The plan I run with", yellow_text: "every client" },
    ],
    caption:
      "Ninety days, nine steps, no miracles. This is the exact order I work in. Comment CREDIT for the dispute templates.",
    hashtags: ["#creditrepair", "#creditscore", "#disputeletters", "#moneytips", "#creditcoach"],
  },
  {
    contentType: "story",
    title: "Story sequence: the denial that started it",
    sections: [
      {
        story: 1,
        purpose: "connection",
        spoken:
          "Six years ago I sat in a dealership and watched them slide my application back across the desk.",
        on_screen: ["I have been denied too", "poll: has this happened to you?"],
      },
      {
        story: 2,
        purpose: "proof",
        spoken:
          "Last week Maria sent me this. 480 when we started, 715 now, and the keys to her first house.",
        on_screen: ["480 to 715", "screenshot of her report"],
      },
      {
        story: 3,
        purpose: "product",
        spoken:
          "That is what the 90-day program does. Three calls a month, the dispute templates, and me checking your reports with you.",
        on_screen: ["90-day program", "1 on 1 coaching"],
      },
      {
        story: 4,
        purpose: "cta",
        spoken:
          "Two spots open this month. Reply CREDIT to this story and I will send you the details.",
        on_screen: ["2 spots left", "reply CREDIT"],
      },
    ],
    covers: null,
    caption: "Internal note: run this sequence the week before opening enrollment.",
    hashtags: ["#creditrepair", "#creditcoach", "#storyselling"],
  },
];
