"use client";

import { useMemo } from "react";
import type { FormSubmissionWithPatient } from "@/types/form";
import type { Patient } from "@/types/patient";
import { processFormsByDay } from "@/lib/utils/chartUtils";
import Card from "./ui/Card";
import SimpleBarChart from "./charts/SimpleBarChart";
import SubmissionListItem from "./charts/SubmissionListItem";

interface DashboardChartsProps {
  submissions: FormSubmissionWithPatient[];
  patients: Patient[];
}

export default function DashboardCharts({
  submissions,
  patients,
}: DashboardChartsProps) {
  // Processa dados para gráfico de formulários por dia (geral)
  const formsByDay = useMemo(
    () => processFormsByDay(submissions),
    [submissions]
  );

  // Últimos formulários enviados
  const recentSubmissions = useMemo(
    () => submissions.slice(0, 5),
    [submissions]
  );

  // Processa dados por paciente
  const formsByPatient = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    return patients.map((patient) => {
      const patientSubmissions = (submissions || []).filter(
        (s) => s.patientId === patient.id
      );

      const patientData = processFormsByDay(patientSubmissions);

      return {
        patient,
        data: patientData,
        total: patientSubmissions.length,
      };
    });
  }, [submissions, patients]);

  return (
    <div className="space-y-8">
      {/* Gráfico de Formulários por Dia (Geral) */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">
          Formulários Enviados por Dia
        </h2>
        {formsByDay.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)]">
            Nenhum formulário enviado ainda.
          </p>
        ) : (
          <div className="h-64">
            <SimpleBarChart data={formsByDay} />
          </div>
        )}
      </Card>

      {/* Últimos Formulários Enviados */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">
          Últimos Formulários Enviados
        </h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)]">
            Nenhum formulário enviado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <SubmissionListItem key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </Card>

      {/* Gráficos por Paciente */}
      {formsByPatient.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Formulários por Paciente
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {formsByPatient.map(({ patient, data, total }) => (
              <Card key={patient.id} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {patient.name}
                  </h3>
                  <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary)]">
                    {total} formulário{total !== 1 ? "s" : ""}
                  </span>
                </div>
                {data.length === 0 ? (
                  <p className="text-center text-sm text-[var(--muted-foreground)]">
                    Nenhum formulário enviado para este paciente.
                  </p>
                ) : (
                  <div className="h-48">
                    <SimpleBarChart data={data} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
