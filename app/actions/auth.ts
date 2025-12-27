"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

export async function signIn(provider: "google", partnerSlug?: string) {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Se houver partnerSlug, salva em um cookie para usar após o callback
  if (partnerSlug) {
    cookieStore.set("partnerSlug", partnerSlug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutos
    });
  }

  // Usa a API do better-auth para obter a URL de redirecionamento
  const result = await auth.api.signInSocial({
    body: {
      provider,
      callbackURL: "/",
    },
    headers: headersList,
  });

  // O better-auth retorna uma URL para redirecionar
  if (result && typeof result === "object") {
    if ("url" in result && result.url) {
      redirect(result.url as string);
      return;
    }
  }

  // Fallback: tenta construir a URL manualmente
  throw new Error("Não foi possível obter a URL de autenticação");
}

export async function signOut() {
  const headersList = await headers();
  await auth.api.signOut({
    headers: headersList,
  });
  redirect("/login");
}

export async function getCurrentUser() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return null;
  }

  return session.session.userId;
}

