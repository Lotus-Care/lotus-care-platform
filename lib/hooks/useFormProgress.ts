import { useMemo } from "react";
import type { Form } from "@/types/strapi";

interface UseFormProgressProps {
  form: Form | null;
  answers: Record<string, string>;
}

/**
 * Hook para calcular o progresso do formulário
 */
export function useFormProgress({ form, answers }: UseFormProgressProps) {
  const progress = useMemo(() => {
    if (!form) return { filledFields: 0, totalFields: 0, percentage: 0 };

    const totalFields = form.secoes.reduce(
      (acc, secao) => acc + secao.campos.length,
      0
    );
    const filledFields = Object.keys(answers).filter(
      (key) => answers[key] && answers[key].trim() !== ""
    ).length;
    const percentage =
      totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

    return { filledFields, totalFields, percentage };
  }, [form, answers]);

  return progress;
}

