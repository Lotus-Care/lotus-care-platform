import { createAuthClient } from "better-auth/react";

// Client do Better Auth para uso no frontend
// https://www.better-auth.com/docs/integrations/next
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks úteis
export const { useSession, signIn, signOut, signUp } = authClient;

