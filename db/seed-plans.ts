import { db } from "./index";
import { plan } from "./schema";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Plano gratuito com limites básicos",
    dailyLimit: 5,
    weeklyLimit: 20,
    monthlyLimit: 50,
    price: "0.00",
    isActive: true,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Plano básico para profissionais individuais",
    dailyLimit: 20,
    weeklyLimit: 100,
    monthlyLimit: 300,
    price: "29.90",
    isActive: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Plano profissional para clínicas e equipes",
    dailyLimit: 100,
    weeklyLimit: 500,
    monthlyLimit: 1500,
    price: "79.90",
    isActive: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Plano empresarial sem limites",
    dailyLimit: 999999,
    weeklyLimit: 999999,
    monthlyLimit: 999999,
    price: "199.90",
    isActive: true,
  },
];

async function seedPlans() {
  try {
    console.log("🌱 Inserindo planos no banco de dados...");

    for (const planData of plans) {
      await db
        .insert(plan)
        .values(planData)
        .onConflictDoUpdate({
          target: plan.id,
          set: {
            name: planData.name,
            description: planData.description,
            dailyLimit: planData.dailyLimit,
            weeklyLimit: planData.weeklyLimit,
            monthlyLimit: planData.monthlyLimit,
            price: planData.price,
            isActive: planData.isActive,
            updatedAt: new Date(),
          },
        });
      console.log(`✅ Plano "${planData.name}" inserido/atualizado`);
    }

    console.log("\n✨ Todos os planos foram inseridos com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao inserir planos:", error);
    process.exit(1);
  }
}

seedPlans();

