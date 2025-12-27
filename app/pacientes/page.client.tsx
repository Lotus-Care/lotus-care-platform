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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Pacientes
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Adicionar Paciente
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
            <p className="text-center text-gray-600 dark:text-gray-400">
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
                    className={`rounded-lg bg-white p-6 shadow-lg transition-all dark:bg-gray-800 ${
                      selectedPatient?.id === patient.id
                        ? "ring-2 ring-blue-500"
                        : "cursor-pointer hover:shadow-xl"
                    }`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {patient.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(patient.id);
                        }}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
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
                <div className="sticky top-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Formulários de {selectedPatient.name}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientForms([]);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>

                  {isLoadingForms ? (
                    <p className="text-center text-gray-600 dark:text-gray-400">
                      Carregando...
                    </p>
                  ) : patientForms.length === 0 ? (
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Nenhum formulário preenchido para este paciente.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {patientForms.map((form) => (
                        <div
                          key={form.id}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
                            {form.formTitle}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                {editingPatient ? "Editar Paciente" : "Novo Paciente"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue={editingPatient?.name || ""}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Sexo
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      defaultValue={editingPatient?.gender || ""}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="followUpEmail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email de Acompanhamento
                    </label>
                    <input
                      type="email"
                      id="followUpEmail"
                      name="followUpEmail"
                      defaultValue={editingPatient?.followUpEmail || ""}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-400 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
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

