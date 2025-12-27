import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  date,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Tabela de Planos
export const plan = pgTable("plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // Ex: "Free", "Basic", "Pro"
  description: text("description"),
  dailyLimit: integer("daily_limit").notNull(), // Limite diário de formulários
  weeklyLimit: integer("weekly_limit").notNull(), // Limite semanal de formulários
  monthlyLimit: integer("monthly_limit").notNull(), // Limite mensal de formulários
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"), // Preço mensal
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  planId: text("plan_id")
    .notNull()
    .default("free")
    .references(() => plan.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  partnerSlug: text("partner_slug").default(""),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const patient = pgTable("patient", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender"), // M, F, Other, etc
  birthDate: date("birth_date"),
  followUpEmail: text("follow_up_email"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formSubmission = pgTable("form_submission", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(), // ID do formulário no Strapi
  formTitle: text("form_title").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patientId: text("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formResponse = pgTable("form_response", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => formSubmission.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(), // ID da pergunta no Strapi
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // "number", "slider", "text"
  answer: text("answer").notNull(), // Resposta como string (será convertida conforme o tipo)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const planRelations = relations(plan, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  plan: one(plan, {
    fields: [user.planId],
    references: [plan.id],
  }),
  patients: many(patient),
  formSubmissions: many(formSubmission),
}));

export const patientRelations = relations(patient, ({ one, many }) => ({
  user: one(user, {
    fields: [patient.userId],
    references: [user.id],
  }),
  formSubmissions: many(formSubmission),
}));

export const formSubmissionRelations = relations(
  formSubmission,
  ({ one, many }) => ({
    user: one(user, {
      fields: [formSubmission.userId],
      references: [user.id],
    }),
    patient: one(patient, {
      fields: [formSubmission.patientId],
      references: [patient.id],
    }),
    responses: many(formResponse),
  })
);

export const formResponseRelations = relations(formResponse, ({ one }) => ({
  submission: one(formSubmission, {
    fields: [formResponse.submissionId],
    references: [formSubmission.id],
  }),
}));
