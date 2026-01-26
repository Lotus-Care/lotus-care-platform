"use client";

import { useState } from "react";
import type { Patient } from "@/types/patient";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useTransition } from "react";

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  onCreatePatient: (data: {
    name: string;
    gender: string;
    birthDate: string;
    followUpEmail: string;
  }) => Promise<Patient>;
  onPatientsUpdate: () => Promise<Patient[]>;
  error?: string | null;
  onPatientsChange?: (patients: Patient[]) => void;
}

export default function PatientSelector({
  patients,
  selectedPatientId,
  onPatientSelect,
  onCreatePatient,
  onPatientsUpdate,
  error,
  onPatientsChange,
}: PatientSelectorProps) {
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCreateError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const gender = formData.get("gender") as string;
    const birthDate = formData.get("birthDate") as string;
    const followUpEmail = formData.get("followUpEmail") as string;

    if (!name || name.trim() === "") {
      setCreateError("Nome é obrigatório");
      return;
    }

    startTransition(async () => {
      try {
        // Cria o paciente
        const newPatient = await onCreatePatient({
          name: name.trim(),
          gender: gender || "",
          birthDate: birthDate || "",
          followUpEmail: followUpEmail || "",
        });

        // Atualiza a lista de pacientes
        await onPatientsUpdate();
        
        // Fecha o formulário de criação
        setShowNewPatientForm(false);
        setCreateError(null);

        // O componente pai irá selecionar o paciente automaticamente através do pendingPatientId
        // Não precisamos chamar onPatientSelect aqui, pois o useEffect no componente pai
        // fará isso quando a lista de pacientes for atualizada
      } catch (err) {
        console.error("Erro ao criar paciente:", err);
        setCreateError(
          err instanceof Error ? err.message : "Erro ao criar paciente. Tente novamente."
        );
      }
    });
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--primary)]/10">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
          Paciente
        </h2>
      </div>

      {(error || createError) && (
        <div className="mb-4 rounded-xl border border-red-500/50 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error || createError}
        </div>
      )}

      {!showNewPatientForm ? (
        <div className="space-y-3">
          <Select
            value={selectedPatientId}
            onChange={(e) => onPatientSelect(e.target.value)}
            required
          >
            <option value="">Selecione um paciente...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowNewPatientForm(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Novo Paciente
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCreatePatient(e);
            }}
            className="space-y-3 sm:space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              name="name"
              label="Nome"
              required
              placeholder="Nome do paciente"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Select name="gender" label="Sexo">
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Other">Outro</option>
              </Select>
              <Input
                type="date"
                name="birthDate"
                label="Data de Nascimento"
              />
            </div>
            <Input
              type="email"
              name="followUpEmail"
              label="Email de Acompanhamento"
              placeholder="email@exemplo.com"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="submit"
                isLoading={isPending}
                className="flex-1"
              >
                Criar Paciente
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowNewPatientForm(false);
                  setCreateError(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}

