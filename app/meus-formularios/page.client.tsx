"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { FormSubmissionWithPatient } from "@/types/form";
import type { Patient } from "@/types/patient";

interface MyFormsClientProps {
  initialSubmissions: FormSubmissionWithPatient[];
  patients: Patient[];
}

export default function MyFormsClient({
  initialSubmissions,
  patients,
}: MyFormsClientProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  // Filtra os formulários baseado no paciente selecionado
  const filteredSubmissions = useMemo(() => {
    if (!selectedPatientId) {
      return initialSubmissions;
    }
    return initialSubmissions.filter(
      (submission) => submission.patientId === selectedPatientId
    );
  }, [initialSubmissions, selectedPatientId]);

  // Obtém lista única de pacientes que têm formulários
  const patientsWithSubmissions = useMemo(() => {
    const patientIds = new Set(initialSubmissions.map((s) => s.patientId));
    return patients.filter((p) => patientIds.has(p.id));
  }, [patients, initialSubmissions]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Meus Formulários
          </h1>

          {/* Filtro por Paciente */}
          {patientsWithSubmissions.length > 0 && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="patient-filter"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Filtrar por paciente:
              </label>
              <select
                id="patient-filter"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              >
                <option value="">Todos os pacientes</option>
                {patientsWithSubmissions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
            <p className="text-center text-[var(--muted-foreground)]">
              {selectedPatientId
                ? "Nenhum formulário encontrado para este paciente."
                : "Nenhum formulário enviado ainda. Acesse a página de Formulários para começar a preencher."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/meus-formularios/${submission.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--primary)] hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-[var(--foreground)]">
                        {submission.formTitle}
                      </h3>
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-medium text-[var(--primary)]">
                        {submission.patientName}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Enviado em{" "}
                      {new Date(
                        submission.createdAt instanceof Date
                          ? submission.createdAt
                          : submission.createdAt
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-[var(--muted-foreground)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

