"use client";

import { useState, useTransition } from "react";
import {
  createPatient,
  updatePatient,
  deletePatient,
  getPatients,
  getFormSubmissionsByPatient,
} from "@/app/actions";
import type { Patient } from "@/types/patient";
import type { FormSubmission } from "@/types/form";

interface PatientsClientProps {
  initialPatients: Patient[];
}

export default function PatientsClient({
  initialPatients,
}: PatientsClientProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientForms, setPatientForms] = useState<FormSubmission[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = (patient?: Patient) => {
    setEditingPatient(patient || null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const data = {
          name: formData.get("name") as string,
          gender: formData.get("gender") as string,
          birthDate: formData.get("birthDate") as string,
          followUpEmail: formData.get("followUpEmail") as string,
        };

        if (editingPatient) {
          await updatePatient(editingPatient.id, data);
        } else {
          await createPatient(data);
        }

        // Recarrega a lista de pacientes
        const updatedPatients = await getPatients();
        setPatients(updatedPatients);
        handleCloseModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar paciente");
      }
    });
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este paciente?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePatient(patientId);
        const updatedPatients = await getPatients();
        setPatients(updatedPatients);
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(null);
          setPatientForms([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao excluir paciente");
      }
    });
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingForms(true);
    setError(null);

    try {
      const forms = await getFormSubmissionsByPatient(patient.id);
      setPatientForms(forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar formulários");
    } finally {
      setIsLoadingForms(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Gerenciamento de Pacientes
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 active:scale-95"
          >
            Adicionar Paciente
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
            <p className="text-center text-[var(--muted-foreground)]">
              Nenhum paciente cadastrado. Clique em "Adicionar Paciente" para
              começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all ${
                      selectedPatient?.id === patient.id
                        ? "ring-2 ring-[var(--primary)]"
                        : "cursor-pointer hover:border-[var(--primary)] hover:shadow-lg active:scale-[0.98]"
                    }`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
                      {patient.name}
                    </h3>
                    <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                      {patient.gender && (
                        <p>
                          <span className="font-medium">Sexo:</span> {patient.gender}
                        </p>
                      )}
                      {patient.birthDate && (
                        <p>
                          <span className="font-medium">Data de Nascimento:</span>{" "}
                          {new Date(patient.birthDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                      {patient.followUpEmail && (
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {patient.followUpEmail}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(patient);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(patient.id);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600 disabled:opacity-50 active:scale-95"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção de Formulários do Paciente Selecionado */}
            {selectedPatient && (
              <div className="lg:col-span-1">
                <div className="sticky top-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      Formulários de {selectedPatient.name}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientForms([]);
                      }}
                      className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                    >
                      ✕
                    </button>
                  </div>

                  {isLoadingForms ? (
                    <p className="text-center text-[var(--muted-foreground)]">
                      Carregando...
                    </p>
                  ) : patientForms.length === 0 ? (
                    <p className="text-center text-sm text-[var(--muted-foreground)]">
                      Nenhum formulário preenchido para este paciente.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {patientForms.map((form) => (
                        <div
                          key={form.id}
                          className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4"
                        >
                          <h4 className="mb-1 font-medium text-[var(--foreground)]">
                            {form.formTitle}
                          </h4>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {new Date(
                              form.createdAt instanceof Date
                                ? form.createdAt
                                : form.createdAt
                            ).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
              <h2 className="mb-4 text-2xl font-bold text-[var(--foreground)]">
                {editingPatient ? "Editar Paciente" : "Novo Paciente"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[var(--foreground)]"
                    >
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue={editingPatient?.name || ""}
                      className="mt-1 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-[var(--foreground)]"
                    >
                      Sexo
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      defaultValue={editingPatient?.gender || ""}
                      className="mt-1 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Other">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="birthDate"
                      className="block text-sm font-medium text-[var(--foreground)]"
                    >
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      defaultValue={
                        editingPatient?.birthDate
                          ? new Date(editingPatient.birthDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="followUpEmail"
                      className="block text-sm font-medium text-[var(--foreground)]"
                    >
                      Email de Acompanhamento
                    </label>
                    <input
                      type="email"
                      id="followUpEmail"
                      name="followUpEmail"
                      defaultValue={editingPatient?.followUpEmail || ""}
                      className="mt-1 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isPending}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted)] disabled:opacity-50 active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
                  >
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

