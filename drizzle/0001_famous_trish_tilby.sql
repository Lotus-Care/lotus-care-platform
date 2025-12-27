CREATE TABLE "form_response" (
	"id" text PRIMARY KEY NOT NULL,
	"submissionId" text NOT NULL,
	"questionId" text NOT NULL,
	"questionText" text NOT NULL,
	"questionType" text NOT NULL,
	"answer" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"formId" text NOT NULL,
	"formTitle" text NOT NULL,
	"userId" text NOT NULL,
	"patientId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gender" text,
	"birthDate" date,
	"followUpEmail" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "partnerSlug" text;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_submissionId_form_submission_id_fk" FOREIGN KEY ("submissionId") REFERENCES "public"."form_submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission" ADD CONSTRAINT "form_submission_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission" ADD CONSTRAINT "form_submission_patientId_patient_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;