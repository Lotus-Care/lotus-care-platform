"use client";

import type { Secao, Campo } from "@/types/strapi";
import FormField from "./FormField";
import { groupFieldsForGrid } from "@/lib/utils/fieldUtils";
import Card from "../ui/Card";

interface FormSectionProps {
  secao: Secao;
  index: number;
  answers: Record<string, string>;
  fieldErrors: Record<string, string>;
  onAnswerChange: (campoId: string, value: string, campo: Campo, shouldScroll?: boolean) => void;
  onFieldBlur: (campoId: string, campo: Campo) => void;
}

export default function FormSection({
  secao,
  index,
  answers,
  fieldErrors,
  onAnswerChange,
  onFieldBlur,
}: FormSectionProps) {
  const fieldGroups = groupFieldsForGrid(secao.campos);

  return (
    <Card className="p-4 sm:p-6 transition-all hover:shadow-md">
      <div className="mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--primary)]/10 text-base sm:text-lg font-bold text-[var(--primary)]">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
            {secao.titulo}
          </h3>
          {secao.descricao && (
            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[var(--muted-foreground)]">
              {secao.descricao}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6 pl-0 sm:pl-14">
        {fieldGroups.map((group, groupIndex) => {
          if (group.type === "grid") {
            return (
              <div
                key={`grid-${groupIndex}`}
                className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {group.fields.map((campo) => (
                  <FormField
                    key={campo.id}
                    campo={campo}
                    value={answers[campo.id.toString()] || ""}
                    error={fieldErrors[campo.id.toString()]}
                    onChange={(value, shouldScroll) =>
                      onAnswerChange(campo.id.toString(), value, campo, shouldScroll)
                    }
                    onBlur={() => onFieldBlur(campo.id.toString(), campo)}
                    inGrid={true}
                  />
                ))}
              </div>
            );
          } else {
            return (
              <div key={`single-${groupIndex}`} className="space-y-4 sm:space-y-6">
                {group.fields.map((campo) => (
                  <FormField
                    key={campo.id}
                    campo={campo}
                    value={answers[campo.id.toString()] || ""}
                    error={fieldErrors[campo.id.toString()]}
                    onChange={(value, shouldScroll) =>
                      onAnswerChange(campo.id.toString(), value, campo, shouldScroll)
                    }
                    onBlur={() => onFieldBlur(campo.id.toString(), campo)}
                    inGrid={false}
                  />
                ))}
              </div>
            );
          }
        })}
      </div>
    </Card>
  );
}

