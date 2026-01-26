import { useEffect } from "react";
import type { Form } from "@/types/strapi";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils/dateUtils";

interface UseAutoFillProps {
  form: Form | null;
  userName: string;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/**
 * Hook para preencher automaticamente campos de data, hora e cuidador
 */
export function useAutoFill({
  form,
  userName,
  answers,
  setAnswers,
}: UseAutoFillProps) {
  // Preenche automaticamente campos de data e hora com a data/hora atual
  useEffect(() => {
    if (!form) return;

    const now = new Date();

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoId = campo.id.toString();

        // Só preenche se o campo ainda não tem valor
        setAnswers((prev) => {
          // Se já tem valor, não altera
          if (prev[campoId]) return prev;

          let valueToSet: string | undefined;

          if (campo.tipo === "data") {
            valueToSet = formatDate(now);
          } else if (campo.tipo === "hora") {
            valueToSet = formatTime(now);
          } else if (campo.tipo === "data_hora") {
            valueToSet = formatDateTime(now);
          }

          if (valueToSet) {
            return {
              ...prev,
              [campoId]: valueToSet,
            };
          }

          return prev;
        });
      });
    });
  }, [form, setAnswers]);

  // Preenche automaticamente campos relacionados a "cuidador" com o nome do usuário
  useEffect(() => {
    if (!form || !userName) return;

    const caregiverKeywords = [
      "cuidador",
      "cuidadora",
      "responsável",
      "responsavel",
      "nome do cuidador",
      "nome da cuidadora",
      "nome do responsável",
      "nome da responsável",
    ];

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoTitle = campo.titulo.toLowerCase().trim();
        const isCaregiverField = caregiverKeywords.some((keyword) =>
          campoTitle.includes(keyword)
        );

        if (
          isCaregiverField &&
          campo.tipo === "texto" &&
          !answers[campo.id.toString()]
        ) {
          setAnswers((prev) => ({
            ...prev,
            [campo.id.toString()]: userName,
          }));
        }
      });
    });
  }, [form, userName, answers, setAnswers]);
}

