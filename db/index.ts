import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Usar neon-http para suporte adequado a transações com Better Auth
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

