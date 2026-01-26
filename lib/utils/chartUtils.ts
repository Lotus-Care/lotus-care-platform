import type { FormSubmissionWithPatient } from "@/types/form";

/**
 * Processa dados para gráfico de formulários por dia
 */
export function processFormsByDay(
  submissions: FormSubmissionWithPatient[]
): { date: string; count: number; fullDate: string }[] {
  if (!submissions || submissions.length === 0) return [];

  const grouped: Record<string, number> = {};

  submissions.forEach((submission) => {
    try {
      const date = new Date(submission.createdAt);
      if (isNaN(date.getTime())) return;
      const dateKey = date.toISOString().split("T")[0];
      grouped[dateKey] = (grouped[dateKey] || 0) + 1;
    } catch (error) {
      console.error("Erro ao processar data:", error);
    }
  });

  const sortedDates = Object.keys(grouped).sort().slice(-30);

  return sortedDates.map((date) => ({
    date: new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    count: grouped[date],
    fullDate: date,
  }));
}

