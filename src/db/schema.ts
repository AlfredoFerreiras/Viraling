import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// USUARIOS: auth propia (email + password con bcrypt, sesiones en DB)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(), // siempre en minúsculas
  passwordHash: text("password_hash"), // null = no puede iniciar sesión hasta fijar contraseña
  role: text("role").notNull().default("user"), // user | editor_house | editor_external | admin
  plan: text("plan").notNull().default("free"), // free | pro | pro_editor
  tokensBalance: integer("tokens_balance").notNull().default(3),
  tokensResetAt: timestamp("tokens_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// SESIONES: id = sha256 del token que viaja en la cookie httpOnly.
// Solo el contexto de servicio las lee/escribe (ver src/lib/auth/session.ts).
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// MULTI-NICHO: un usuario puede tener varios nichos
export const niches = pgTable("niches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Credit repair en español"
  audience: text("audience"),
  offer: text("offer"),
  ctaWord: text("cta_word"),
  language: text("language").default("es"),
  brandVoice: jsonb("brand_voice"), // respuestas del cuestionario de marca (req 5)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// BIBLIOTECA DE FORMATOS
export const formats = pgTable("formats", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerScope: text("owner_scope").notNull().default("global"), // global (admin) | user
  userId: uuid("user_id").references(() => users.id), // null si es global
  nicheId: uuid("niche_id").references(() => niches.id), // para formatos extraídos por el user
  name: text("name").notNull(), // "Tier List", "Funciona / No Funciona"
  contentType: text("content_type").notNull(), // reel | carousel | story
  skeleton: jsonb("skeleton").notNull(), // secciones, ritmo, visual, hook_type, cta_type
  sourceTranscript: text("source_transcript"),
  referenceImages: text("reference_images").array(), // keys de R2
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
  covers: jsonb("covers"), // 3 variaciones con split blanco/amarillo
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  pdfKey: text("pdf_key"), // key de R2 del PDF exportado (Fase posterior)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// CONFIG GLOBAL (kill switch de IA, umbrales) — solo admin
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// LEDGER DE TOKENS: nunca modificar balance sin registrar movimiento
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // negativo consume, positivo acredita
  reason: text("reason").notNull(), // generation | extraction | analysis | monthly_reset | purchase | admin_grant
  refId: uuid("ref_id"), // id del script que lo consumió
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
