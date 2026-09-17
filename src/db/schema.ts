import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// USERS: own auth (email + password with bcrypt, sessions in the DB)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(), // always lowercase
  passwordHash: text("password_hash"), // null = cannot sign in until a password is set
  role: text("role").notNull().default("user"), // user | editor_house | editor_external | admin
  plan: text("plan").notNull().default("free"), // free | pro | pro_editor
  tokensBalance: integer("tokens_balance").notNull().default(3),
  tokensResetAt: timestamp("tokens_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// SESSIONS: id = sha256 of the token carried in the httpOnly cookie.
// Only the service context reads/writes them (see src/lib/auth/session.ts).
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// MULTI-NICHE: a user can have several niches
export const niches = pgTable("niches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Credit repair for beginners"
  audience: text("audience"),
  offer: text("offer"),
  ctaWord: text("cta_word"),
  language: text("language").default("en"),
  brandVoice: jsonb("brand_voice"), // answers to the brand questionnaire (req 5)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// BIBLIOTECA DE FORMATOS
export const formats = pgTable("formats", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerScope: text("owner_scope").notNull().default("global"), // global (admin) | user
  userId: uuid("user_id").references(() => users.id), // null when global
  nicheId: uuid("niche_id").references(() => niches.id), // for formats extracted by the user
  name: text("name").notNull(), // "Tier List", "Works / Doesn't Work"
  contentType: text("content_type").notNull(), // reel | carousel | story
  skeleton: jsonb("skeleton").notNull(), // sections, pacing, visuals, hook_type, cta_type
  sourceTranscript: text("source_transcript"),
  referenceImages: text("reference_images").array(), // R2 keys
  performanceNotes: text("performance_notes"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// GUIONES GENERADOS
export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  nicheId: uuid("niche_id")
    .notNull()
    .references(() => niches.id),
  formatId: uuid("format_id")
    .notNull()
    .references(() => formats.id),
  contentType: text("content_type").notNull(), // reel | carousel | story
  title: text("title"),
  sections: jsonb("sections").notNull(), // [{section, time_start, time_end, spoken, on_screen[]}]
  covers: jsonb("covers"), // 3 variations with a white/yellow split
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  pdfKey: text("pdf_key"), // R2 key of the exported PDF (later phase)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// GLOBAL CONFIG (AI kill switch, thresholds): admin only
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// TOKEN LEDGER: never change a balance without recording a movement
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // negativo consume, positivo acredita
  reason: text("reason").notNull(), // generation | extraction | analysis | monthly_reset | purchase | admin_grant
  refId: uuid("ref_id"), // id of the script that spent it
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
