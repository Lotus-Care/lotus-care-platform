import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET não está definido nas variáveis de ambiente"
  );
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET devem estar definidos nas variáveis de ambiente"
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    transaction: false,
  }),
  user: {
    additionalFields: {
      partnerSlug: {
        type: "string",
        defaultValue: "",
        required: false,
        casing: "camel",
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    nextCookies(), // Plugin recomendado pela documentação para Next.js
  ],
  logger:
    process.env.NODE_ENV === "development"
      ? {
          level: "info",
        }
      : undefined,
});

export type Session = typeof auth.$Infer.Session;
