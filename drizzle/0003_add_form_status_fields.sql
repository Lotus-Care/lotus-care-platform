ALTER TABLE "form_submission" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
ALTER TABLE "form_submission" ADD COLUMN "finalized_at" timestamp;
ALTER TABLE "form_submission" ADD COLUMN "checkup_end_time" timestamp;

-- Set existing submissions as finalized (they were created before the draft system)
UPDATE "form_submission" SET "status" = 'finalized', "finalized_at" = "created_at", "checkup_end_time" = "created_at" WHERE "status" = 'draft';
