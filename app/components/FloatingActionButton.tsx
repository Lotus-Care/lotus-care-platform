"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function FloatingActionButton() {
  const pathname = usePathname();
  
  // Não mostra o botão na página de formulários
  if (pathname === "/formularios") {
    return null;
  }

  return (
    <Link
      href="/formularios"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 lg:bottom-8 lg:right-8"
      aria-label="Criar novo formulário"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </Link>
  );
}

