"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { FormSubmissionWithPatient } from "@/types/form";
import type { Patient } from "@/types/patient";
import { formatDateForDisplay, formatDateShort } from "@/lib/utils/dateUtils";
import Card from "@/app/components/ui/Card";
import Select from "@/app/components/ui/Select";
import Input from "@/app/components/ui/Input";

interface MyFormsClientProps {
  initialSubmissions: FormSubmissionWithPatient[];
  patients: Patient[];
  initialStatusFilter?: string;
}

function getSubmissionTitle(submission: FormSubmissionWithPatient): string {
  const dateObj =
    submission.createdAt instanceof Date
      ? submission.createdAt
      : new Date(submission.createdAt);
  const dateStr = formatDateShort(dateObj);
  return `${dateStr} — ${submission.patientName}`;
}

export default function MyFormsClient({
  initialSubmissions,
  patients,
  initialStatusFilter = "",
}: MyFormsClientProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredSubmissions = useMemo(() => {
    let filtered = initialSubmissions;

    if (selectedPatientId) {
      filtered = filtered.filter(
        (s) => s.patientId === selectedPatientId
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        const d = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
        return d >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((s) => {
        const d = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
        return d <= to;
      });
    }

    return filtered;
  }, [initialSubmissions, selectedPatientId, statusFilter, dateFrom, dateTo]);

  const patientsWithSubmissions = useMemo(() => {
    const patientIds = new Set(initialSubmissions.map((s) => s.patientId));
    return patients.filter((p) => patientIds.has(p.id));
  }, [patients, initialSubmissions]);

  const hasActiveFilters = selectedPatientId || statusFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setSelectedPatientId("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Meus Formulários
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {initialSubmissions.length} formulário{initialSubmissions.length !== 1 ? "s" : ""}
              {hasActiveFilters && ` · ${filteredSubmissions.length} exibido${filteredSubmissions.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted)] active:scale-95 self-start"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-foreground)]">
                {[selectedPatientId, statusFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card className="mb-6 p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paciente */}
              <div>
                <label
                  htmlFor="patient-filter"
                  className="mb-1.5 block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider"
                >
                  Paciente
                </label>
                <Select
                  id="patient-filter"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Todos os pacientes</option>
                  {patientsWithSubmissions.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status-filter"
                  className="mb-1.5 block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider"
                >
                  Status
                </label>
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="">Todos</option>
                  <option value="draft">Rascunhos</option>
                  <option value="finalized">Finalizados</option>
                </Select>
              </div>

              {/* Data de */}
              <div>
                <label
                  htmlFor="date-from"
                  className="mb-1.5 block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider"
                >
                  Data de
                </label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Data até */}
              <div>
                <label
                  htmlFor="date-to"
                  className="mb-1.5 block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider"
                >
                  Data até
                </label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Lista */}
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-[var(--muted-foreground)]">
              {hasActiveFilters
                ? "Nenhum formulário encontrado com os filtros selecionados."
                : "Nenhum formulário enviado ainda. Acesse a página de Formulários para começar a preencher."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => {
              const isDraft = submission.status === "draft";
              const href = isDraft
                ? `/formularios?submission=${submission.id}`
                : `/meus-formularios/${submission.id}`;
              const title = getSubmissionTitle(submission);

              return (
                <Link key={submission.id} href={href} className="block">
                  <Card className="p-4 sm:p-5 transition-all hover:border-[var(--primary)] hover:shadow-lg active:scale-[0.99]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Título: data + paciente */}
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] truncate">
                          {title}
                        </h3>

                        {/* Detalhes */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {isDraft ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Rascunho
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Finalizado
                            </span>
                          )}

                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDateForDisplay(
                              submission.createdAt instanceof Date
                                ? submission.createdAt
                                : submission.createdAt
                            )}
                          </span>

                          {submission.finalizedAt && (
                            <span className="hidden sm:inline text-xs text-[var(--muted-foreground)]">
                              · Finalizado{" "}
                              {formatDateForDisplay(
                                submission.finalizedAt instanceof Date
                                  ? submission.finalizedAt
                                  : submission.finalizedAt
                              )}
                            </span>
                          )}
                        </div>

                        {isDraft && (
                          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Clique para continuar editando
                          </p>
                        )}
                      </div>

                      {/* Ícone */}
                      <svg
                        className="h-5 w-5 text-[var(--muted-foreground)] flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            isDraft
                              ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              : "M9 5l7 7-7 7"
                          }
                        />
                      </svg>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
