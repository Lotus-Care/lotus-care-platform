"use client";

import { signIn } from "@/app/actions";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPartnerInfo } from "@/app/actions";
import type { PartnerInfo } from "@/types/partner";
import Card from "@/app/components/ui/Card";
import GoogleSignInButton from "@/app/components/ui/GoogleSignInButton";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Alert from "@/app/components/ui/Alert";

export default function PartnerLoginPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchPartner() {
      try {
        const data = await getPartnerInfo(slug);
        setPartnerInfo(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao buscar parceria:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar informações da parceria"
        );
        setIsLoading(false);
        // Redireciona para home em caso de erro
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }

    fetchPartner();
  }, [slug, router]);

  const handleGoogleSignIn = async () => {
    if (!slug) return;

    setIsSigningIn(true);
    try {
      await signIn("google", slug);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setIsSigningIn(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !partnerInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md p-8">
          <Alert variant="error">
            {error || "Parceria não encontrada"}
          </Alert>
        </Card>
      </div>
    );
  }

  // Login Form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          {partnerInfo.logo && (
            <div className="mb-4 flex justify-center">
              <img
                src={partnerInfo.logo}
                alt={`Logo ${partnerInfo.name}`}
                className="h-20 w-auto object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Bem-vindo ao Lotus Care
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Parceria: {partnerInfo.name}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Faça login com sua conta Google para continuar
          </p>
        </div>

        {/* Sign In Button */}
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          isLoading={isSigningIn}
        />

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          Ao continuar, você concorda com nossos Termos de Serviço e Política de
          Privacidade
        </p>
      </Card>
    </div>
  );
}
