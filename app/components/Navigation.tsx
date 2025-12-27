"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Lorus Care
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/formularios"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/formularios")
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Formulários
              </Link>
              <Link
                href="/meus-formularios"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/meus-formularios")
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Meus Formulários
              </Link>
              <Link
                href="/pacientes"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/pacientes")
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Pacientes
              </Link>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

