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
import { formatDateShort } from "@/lib/utils/dateUtils";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Modal from "@/app/components/ui/Modal";
import Alert from "@/app/components/ui/Alert";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";

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
          <Button onClick={() => handleOpenModal()}>
            Adicionar Paciente
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {patients.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-[var(--muted-foreground)]">
              Nenhum paciente cadastrado. Clique em "Adicionar Paciente" para
              começar.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {patients.map((patient) => (
                  <Card
                    key={patient.id}
                    className={`p-6 transition-all cursor-pointer ${
                      selectedPatient?.id === patient.id
                        ? "ring-2 ring-[var(--primary)]"
                        : "hover:border-[var(--primary)] hover:shadow-lg active:scale-[0.98]"
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
                          {formatDateShort(patient.birthDate)}
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
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(patient);
                        }}
                        disabled={isPending}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(patient.id);
                        }}
                        disabled={isPending}
                        className="flex-1"
                      >
                        Excluir
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Seção de Formulários do Paciente Selecionado */}
            {selectedPatient && (
              <div className="lg:col-span-1">
                <Card className="sticky top-8 p-6">
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
                            {formatDateShort(form.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingPatient ? "Editar Paciente" : "Novo Paciente"}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="patient-form"
                disabled={isPending}
                isLoading={isPending}
                className="flex-1"
              >
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </>
          }
        >
          <form id="patient-form" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                name="name"
                label="Nome"
                required
                defaultValue={editingPatient?.name || ""}
              />

              <Select
                name="gender"
                label="Sexo"
                defaultValue={editingPatient?.gender || ""}
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Other">Outro</option>
              </Select>

              <Input
                type="date"
                name="birthDate"
                label="Data de Nascimento"
                defaultValue={
                  editingPatient?.birthDate
                    ? new Date(editingPatient.birthDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
              />

              <Input
                type="email"
                name="followUpEmail"
                label="Email de Acompanhamento"
                defaultValue={editingPatient?.followUpEmail || ""}
              />
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
