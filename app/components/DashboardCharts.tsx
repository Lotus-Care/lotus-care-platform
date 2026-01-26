"use client";

import { useMemo } from "react";
import type { FormSubmissionWithPatient } from "@/types/form";
import type { Patient } from "@/types/patient";

interface DashboardChartsProps {
  submissions: FormSubmissionWithPatient[];
  patients: Patient[];
}

export default function DashboardCharts({
  submissions,
  patients,
}: DashboardChartsProps) {
  // Processa dados para gráfico de formulários por dia (geral)
  const formsByDay = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    
    submissions.forEach((submission) => {
      try {
        const date = new Date(submission.createdAt);
        if (isNaN(date.getTime())) return; // Ignora datas inválidas
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        grouped[dateKey] = (grouped[dateKey] || 0) + 1;
      } catch (error) {
        console.error("Erro ao processar data:", error);
      }
    });

    // Ordena por data e pega os últimos 30 dias
    const sortedDates = Object.keys(grouped)
      .sort()
      .slice(-30);

    return sortedDates.map((date) => ({
      date: new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      count: grouped[date],
      fullDate: date,
    }));
  }, [submissions]);

  // Últimos formulários enviados
  const recentSubmissions = useMemo(() => {
    return submissions.slice(0, 5);
  }, [submissions]);

  // Processa dados por paciente
  const formsByPatient = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    
    return patients.map((patient) => {
      const patientSubmissions = (submissions || []).filter(
        (s) => s.patientId === patient.id
      );

      const grouped: Record<string, number> = {};
      patientSubmissions.forEach((submission) => {
        try {
          const date = new Date(submission.createdAt);
          if (isNaN(date.getTime())) return; // Ignora datas inválidas
          const dateKey = date.toISOString().split("T")[0];
          grouped[dateKey] = (grouped[dateKey] || 0) + 1;
        } catch (error) {
          console.error("Erro ao processar data:", error);
        }
      });

      const sortedDates = Object.keys(grouped).sort().slice(-30);

      return {
        patient,
        data: sortedDates.map((date) => ({
          date: new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          count: grouped[date],
          fullDate: date,
        })),
        total: patientSubmissions.length,
      };
    });
  }, [submissions, patients]);

  // Verifica se recharts está disponível
  const hasRecharts = typeof window !== "undefined" && 
    // @ts-ignore
    typeof window.Recharts !== "undefined";

  return (
    <div className="space-y-8">
      {/* Gráfico de Formulários por Dia (Geral) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
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
      </div>

      {/* Últimos Formulários Enviados */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
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
              <div
                key={submission.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {submission.formTitle}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Paciente: {submission.patientName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {new Date(submission.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(submission.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráficos por Paciente */}
      {formsByPatient.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Formulários por Paciente
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {formsByPatient.map(({ patient, data, total }) => (
              <div
                key={patient.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de gráfico de barras simples usando SVG
function SimpleBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const padding = 40;
  const barSpacing = 8;
  const minBarWidth = 24;
  const maxBarWidth = 48;
  
  // Calcula largura dinâmica baseada no número de barras
  const availableWidth = 800; // Largura base do SVG
  const calculatedBarWidth = Math.max(
    minBarWidth,
    Math.min(maxBarWidth, (availableWidth - padding * 2) / data.length - barSpacing)
  );
  
  const chartWidth = Math.max(400, data.length * (calculatedBarWidth + barSpacing) + padding * 2);

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="min-h-[200px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Linha de referência */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="var(--border)"
          strokeWidth="1"
        />
        
        {data.map((item, index) => {
          const barHeight = maxCount > 0 
            ? (item.count / maxCount) * (chartHeight - padding * 2 - 20)
            : 0;
          const x = index * (calculatedBarWidth + barSpacing) + padding;
          const y = chartHeight - padding - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={calculatedBarWidth}
                height={barHeight}
                fill="var(--primary)"
                rx={4}
                className="transition-all hover:opacity-80"
                style={{ fill: "var(--primary)" }}
              />
              <text
                x={x + calculatedBarWidth / 2}
                y={chartHeight - padding + 15}
                textAnchor="middle"
                style={{ fill: "var(--muted-foreground)" }}
                fontSize="10"
              >
                {item.date}
              </text>
              {item.count > 0 && (
                <text
                  x={x + calculatedBarWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  style={{ fill: "var(--foreground)" }}
                  fontSize="11"
                  fontWeight="500"
                >
                  {item.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

