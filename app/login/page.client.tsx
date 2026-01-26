"use client";

import { signIn } from "@/app/actions";
import { useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import Card from "@/app/components/ui/Card";
import GoogleSignInButton from "@/app/components/ui/GoogleSignInButton";

export default function LoginPageClient() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Bem-vindo ao Lotus Care
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Faça login com sua conta Google para continuar
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-lg">
          <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={isLoading} />

          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de
            Privacidade
          </p>
        </Card>
      </div>
    </div>
  );
}
