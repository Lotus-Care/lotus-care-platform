import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { headers, cookies } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  // Verifica se há partnerSlug no cookie e se o usuário ainda não tem um salvo
  const partnerSlugCookie = cookieStore.get("partnerSlug")?.value;
  if (partnerSlugCookie && session.session.userId) {
    try {
      const [currentUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.session.userId))
        .limit(1);
      
      // Se o usuário não tem partnerSlug, salva o do cookie
      if (currentUser && !currentUser.partnerSlug) {
        await db
          .update(user)
          .set({ partnerSlug: partnerSlugCookie })
          .where(eq(user.id, session.session.userId));
      }
      
      // Remove o cookie após processar
      cookieStore.delete("partnerSlug");
    } catch (error) {
      console.error("Erro ao processar partnerSlug:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bem-vindo ao Lorus Care
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Você está autenticado com sucesso!
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Informações da Sessão
          </h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Nome:
              </span>{" "}
              <span className="text-gray-900 dark:text-white">
                {session.user.name}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Email:
              </span>{" "}
              <span className="text-gray-900 dark:text-white">
                {session.user.email}
              </span>
            </div>
            {session.user.image && (
              <div className="mt-4">
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <a
            href="/formularios"
            className="block rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
          >
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Formulários
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Preencha formulários para seus pacientes
            </p>
          </a>

          <a
            href="/pacientes"
            className="block rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
          >
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Pacientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus pacientes cadastrados
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
