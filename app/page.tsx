import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAllFormSubmissions } from "@/app/actions/form";
import { getPatients } from "@/app/actions/patient";
import DashboardCharts from "./components/DashboardCharts";
import QuickActionCard from "./components/ui/QuickActionCard";
import UserHeader from "./components/ui/UserHeader";

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

  // Busca dados para os gráficos
  const [submissions, patients] = await Promise.all([
    getAllFormSubmissions().catch(() => []),
    getPatients().catch(() => []),
  ]);

  const quickActions = [
    {
      href: "/formularios",
      title: "Novo Formulário",
      description: "Preencha formulários para seus pacientes",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/meus-formularios",
      title: "Meus Formulários",
      description: "Visualize e gerencie seus formulários preenchidos",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: "/pacientes",
      title: "Pacientes",
      description: "Gerencie seus pacientes cadastrados",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 py-12 pt-20 sm:px-6 lg:px-8 lg:pt-12">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-12">
          <UserHeader
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">
            Acesso Rápido
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.href}
                href={action.href}
                title={action.title}
                description={action.description}
                icon={action.icon}
              />
            ))}
          </div>
        </div>

        {/* Dashboard Charts */}
        <DashboardCharts submissions={submissions} patients={patients} />
      </div>
    </div>
  );
}
