import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Padrão recomendado pela documentação oficial do Better Auth
// https://www.better-auth.com/docs/integrations/next
export const { GET, POST } = toNextJsHandler(auth);

