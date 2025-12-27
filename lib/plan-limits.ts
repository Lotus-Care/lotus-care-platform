import { db } from "@/db";
import { formSubmission, user, plan } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Verifica se o usuário atingiu os limites do plano
 */
export async function checkUserLimits(userId: string) {
  // Buscar usuário e plano
  const [userData] = await db
    .select({
      dailyLimit: plan.dailyLimit,
      weeklyLimit: plan.weeklyLimit,
      monthlyLimit: plan.monthlyLimit,
      planName: plan.name,
    })
    .from(user)
    .innerJoin(plan, eq(user.planId, plan.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData) {
    throw new Error("Usuário não encontrado");
  }

  const now = new Date();

  // Calcular início do dia (00:00:00)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Calcular início da semana (domingo)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Calcular início do mês
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Contar formulários submetidos hoje
  const [dailyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, userId),
        gte(formSubmission.createdAt, startOfDay)
      )
    );

  // Contar formulários submetidos esta semana
  const [weeklyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, userId),
        gte(formSubmission.createdAt, startOfWeek)
      )
    );

  // Contar formulários submetidos este mês
  const [monthlyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.userId, userId),
        gte(formSubmission.createdAt, startOfMonth)
      )
    );

  const daily = dailyCount?.count || 0;
  const weekly = weeklyCount?.count || 0;
  const monthly = monthlyCount?.count || 0;

  return {
    planName: userData.planName,
    limits: {
      daily: {
        used: daily,
        limit: userData.dailyLimit,
        remaining: Math.max(0, userData.dailyLimit - daily),
        exceeded: daily >= userData.dailyLimit,
      },
      weekly: {
        used: weekly,
        limit: userData.weeklyLimit,
        remaining: Math.max(0, userData.weeklyLimit - weekly),
        exceeded: weekly >= userData.weeklyLimit,
      },
      monthly: {
        used: monthly,
        limit: userData.monthlyLimit,
        remaining: Math.max(0, userData.monthlyLimit - monthly),
        exceeded: monthly >= userData.monthlyLimit,
      },
    },
    canSubmit:
      daily < userData.dailyLimit &&
      weekly < userData.weeklyLimit &&
      monthly < userData.monthlyLimit,
  };
}

/**
 * Verifica se o usuário pode submeter um novo formulário
 */
export async function canSubmitForm(userId: string): Promise<boolean> {
  const limits = await checkUserLimits(userId);
  return limits.canSubmit;
}

/**
 * Retorna mensagem de erro apropriada quando o limite é excedido
 */
export function getLimitExceededMessage(limits: Awaited<ReturnType<typeof checkUserLimits>>) {
  if (limits.limits.daily.exceeded) {
    return `Você atingiu o limite diário de ${limits.limits.daily.limit} formulários do plano ${limits.planName}. Tente novamente amanhã ou faça upgrade do seu plano.`;
  }
  if (limits.limits.weekly.exceeded) {
    return `Você atingiu o limite semanal de ${limits.limits.weekly.limit} formulários do plano ${limits.planName}. Tente novamente na próxima semana ou faça upgrade do seu plano.`;
  }
  if (limits.limits.monthly.exceeded) {
    return `Você atingiu o limite mensal de ${limits.limits.monthly.limit} formulários do plano ${limits.planName}. Tente novamente no próximo mês ou faça upgrade do seu plano.`;
  }
  return "Limite de formulários excedido.";
}

