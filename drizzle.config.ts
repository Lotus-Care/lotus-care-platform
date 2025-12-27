import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // fallback para .env

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não encontrada nas variáveis de ambiente. Certifique-se de criar o arquivo .env.local");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

