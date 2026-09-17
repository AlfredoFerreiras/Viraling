ALTER TABLE "niches" ALTER COLUMN "language" SET DEFAULT 'en';--> statement-breakpoint
UPDATE "niches" SET "language" = 'en' WHERE "language" IS DISTINCT FROM 'en';
