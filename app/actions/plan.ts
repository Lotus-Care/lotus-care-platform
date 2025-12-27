"use server";

import { getCurrentUser } from "./auth";

export async function getUserPlanInfo() {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const { checkUserLimits } = await import("@/lib/plan-limits");
  return await checkUserLimits(userId);
}

