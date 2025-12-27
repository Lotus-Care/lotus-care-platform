"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveFormSubmission,
  createPatient,
  getPatients,
} from "@/app/actions";
import type { FormAnswer } from "@/types/form";
import type { Form, Campo, Alerta } from "@/types/strapi";
import type { Patient } from "@/types/patient";

interface FormsClientProps {
  initialForms: Form[];
  initialPatients: Patient[];
  strapiError?: { status: number; message: string };
}

export default function FormsClient({
  initialForms,
  initialPatients,
  strapiError,
}: FormsClientProps) {
  const [forms] = useState(initialForms);
  const [patients, setPatients] = useState(initialPatients);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectForm = (form: Form) => {
    setSelectedForm(form);
    setAnswers({});
    setSelectedPatientId("");
    setShowNewPatientForm(false);
    setError(null);
  };

  const handleAnswerChange = (campoId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [campoId]: value,
    }));
  };

  const handleCreatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const newPatient = await createPatient({
          name: formData.get("name") as string,
          gender: formData.get("gender") as string,
          birthDate: formData.get("birthDate") as string,
          followUpEmail: formData.get("followUpEmail") as string,
        });

        const updatedPatients = await getPatients();
        setPatients(updatedPatients);
        setSelectedPatientId(newPatient.id);
        setShowNewPatientForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar paciente");
      }
    });
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedForm) return;
    if (!selectedPatientId) {
      setError("Por favor, selecione ou crie um paciente");
      return;
    }

    // Coleta todas as respostas de todas as seções e campos
    const formAnswers: FormAnswer[] = [];

    selectedForm.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoId = campo.id.toString();
        const answer = answers[campoId];

        if (answer !== undefined && answer !== "") {
          // Mapeia o tipo do campo para o tipo esperado pela action
          let questionType: "number" | "slider" | "text" = "text";
          if (campo.tipo === "numerico") {
            questionType = "number";
          } else if (campo.tipo === "slider") {
            questionType = "slider";
          } else if (campo.tipo === "texto") {
            questionType = "text";
          }

          formAnswers.push({
            questionId: campoId,
            questionText: campo.titulo,
            questionType,
            answer,
          });
        }
      });
    });

    startTransition(async () => {
      try {
        await saveFormSubmission({
          formId: selectedForm.id.toString(),
          formTitle: selectedForm.titulo,
          patientId: selectedPatientId,
          answers: formAnswers,
        });

        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar formulário");
      }
    });
  };

  // Função para verificar e retornar alertas ativos para um campo
  const getActiveAlerts = (campo: Campo, value: string): Alerta[] => {
    if (!campo.alertas || campo.alertas.length === 0) return [];
    if (!value || value.trim() === "") return [];

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return [];

    return campo.alertas.filter((alerta) => {
      if (alerta.avisar_quando === "Valor for Acima") {
        return numValue > alerta.Valor;
      } else if (alerta.avisar_quando === "Valor for Abaixo") {
        return numValue < alerta.Valor;
      }
      return false;
    });
  };

  const renderCampo = (campo: Campo) => {
    const campoId = campo.id.toString();
    const value = answers[campoId] || "";
    const activeAlerts = getActiveAlerts(campo, value);

    const renderInput = () => {
      switch (campo.tipo) {
        case "numerico":
          return (
            <input
              type="number"
              id={campoId}
              value={value}
              onChange={(e) => handleAnswerChange(campoId, e.target.value)}
              required={campo.obrigatorio}
              placeholder={campo.placeholder}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          );

        case "slider":
          return (
            <div className="mt-1">
              <input
                type="range"
                id={campoId}
                value={value || "0"}
                onChange={(e) => handleAnswerChange(campoId, e.target.value)}
                min="0"
                max="100"
                step="1"
                required={campo.obrigatorio}
                className="w-full"
              />
              <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {value || "0"}
              </div>
            </div>
          );

        case "texto":
          return (
            <input
              type="text"
              id={campoId}
              value={value}
              onChange={(e) => handleAnswerChange(campoId, e.target.value)}
              required={campo.obrigatorio}
              placeholder={campo.placeholder}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          );

        default:
          return null;
      }
    };

    return (
      <div key={campo.id} className="space-y-2">
        <label
          htmlFor={campoId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {campo.titulo}
          {campo.obrigatorio && <span className="text-red-500"> *</span>}
        </label>
        {campo.descricao && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {campo.descricao}
          </p>
        )}
        {renderInput()}
        {activeAlerts.length > 0 && (
          <div className="space-y-1">
            {activeAlerts.map((alerta) => {
              // Determina a cor baseada no tipo de alerta
              const severityColor =
                alerta.avisar_quando === "Valor for Acima"
                  ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200"
                  : "bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200";

              return (
                <div
                  key={alerta.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${severityColor}`}
                >
                  <div className="font-semibold">{alerta.Mensagem}</div>
                  <div className="text-xs opacity-75">
                    Valor: {value} | Condição: {alerta.avisar_quando}{" "}
                    {alerta.Valor}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Formulários
        </h1>

        {strapiError && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            Erro ao carregar formulários: {strapiError.message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {!selectedForm ? (
          <div className="space-y-4">
            {forms.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Nenhum formulário disponível no momento.
                </p>
              </div>
            ) : (
              forms.map((form) => {
                const totalCampos = form.secoes.reduce(
                  (acc, secao) => acc + secao.campos.length,
                  0
                );

                return (
                  <div
                    key={form.id}
                    className="cursor-pointer rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
                    onClick={() => handleSelectForm(form)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                          {form.titulo}
                        </h2>
                        {form.descricao && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {form.descricao}
                          </p>
                        )}
                        <div className="mt-3 flex gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <span>{form.secoes.length} seção(ões)</span>
                          <span>{totalCampos} campo(s)</span>
                          {form.versao && <span>v{form.versao}</span>}
                        </div>
                      </div>
                      {form.ativo && (
                        <span className="ml-4 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedForm.titulo}
                  </h2>
                  {selectedForm.descricao && (
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {selectedForm.descricao}
                    </p>
                  )}
                  {selectedForm.versao && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Versão {selectedForm.versao}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedForm(null);
                    setAnswers({});
                    setSelectedPatientId("");
                    setShowNewPatientForm(false);
                  }}
                  className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Voltar
                </button>
              </div>

              {/* Seleção de Paciente */}
              <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Selecionar Paciente
                </h3>

                {!showNewPatientForm ? (
                  <div className="space-y-3">
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione um paciente...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewPatientForm(true)}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                      + Adicionar Novo Paciente
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreatePatient} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sexo
                        </label>
                        <select
                          name="gender"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Selecione...</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="Other">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          name="birthDate"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email de Acompanhamento
                      </label>
                      <input
                        type="email"
                        name="followUpEmail"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
                      >
                        {isPending ? "Criando..." : "Criar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewPatientForm(false);
                          setError(null);
                        }}
                        className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Seções e Campos do Formulário */}
              <div className="space-y-8">
                {selectedForm.secoes.map((secao) => (
                  <div
                    key={secao.id}
                    className="rounded-lg border border-gray-200 p-5 dark:border-gray-700"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {secao.titulo}
                      </h3>
                      {secao.descricao && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {secao.descricao}
                        </p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {secao.campos.map((campo) => renderCampo(campo))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || !selectedPatientId}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {isPending ? "Salvando..." : "Salvar Formulário"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

