"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  saveFormSubmission,
  createPatient,
  getPatients,
} from "@/app/actions";
import { validateForm, validateField } from "@/lib/form-validation";
import type { FormAnswer } from "@/types/form";
import type { Form, Campo } from "@/types/strapi";
import type { Patient } from "@/types/patient";
import { useAutoFill } from "@/lib/hooks/useAutoFill";
import { useFormProgress } from "@/lib/hooks/useFormProgress";
import { useScrollToField, scrollToField } from "@/lib/hooks/useScrollToField";
import FormSection from "@/app/components/forms/FormSection";
import PatientSelector from "@/app/components/forms/PatientSelector";
import Button from "@/app/components/ui/Button";
import Alert from "@/app/components/ui/Alert";
import ProgressBar from "@/app/components/ui/ProgressBar";
import Card from "@/app/components/ui/Card";

interface FormsClientProps {
  initialForm: Form | null;
  initialPatients: Patient[];
  strapiError?: { status: number; message: string };
  userName: string;
}

export default function FormsClient({
  initialForm,
  initialPatients,
  strapiError,
  userName,
}: FormsClientProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { scrollToNextField } = useScrollToField();

  const form = initialForm;

  // Calcula progresso do formulário
  const { filledFields, totalFields } = useFormProgress({
    form,
    answers,
  });

  // Auto-preenchimento de campos
  useAutoFill({
    form,
    userName,
    answers,
    setAnswers,
  });

  // Seleciona automaticamente o primeiro paciente se disponível
  useEffect(() => {
    if (!form) return;
    if (!selectedPatientId && patients.length > 0) {
      // Usa setTimeout para evitar chamar setState diretamente no effect
      const timer = setTimeout(() => {
        setSelectedPatientId(patients[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [form, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seleciona o paciente pendente quando a lista for atualizada
  useEffect(() => {
    if (pendingPatientId && patients.some(p => p.id === pendingPatientId)) {
      // Usa setTimeout para evitar chamar setState diretamente no effect
      const timer = setTimeout(() => {
        setSelectedPatientId(pendingPatientId);
        setPendingPatientId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [patients, pendingPatientId]);

  const handleAnswerChange = (
    campoId: string,
    value: string,
    campo: Campo,
    shouldScroll: boolean = false
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [campoId]: value,
    }));

    // Limpa erros durante a digitação
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[campoId]?.includes("mínimo") || newErrors[campoId]?.includes("máximo")) {
        delete newErrors[campoId];
      }
      return newErrors;
    });

    // Se for radio ou select e shouldScroll for true, faz scroll para o próximo campo
    if (shouldScroll && (campo.tipo === "radio" || campo.tipo === "select")) {
      const allCampos: Campo[] = [];
      form?.secoes.forEach((secao) => {
        allCampos.push(...secao.campos);
      });
      scrollToNextField(campoId, allCampos);
    }
  };

  const handleFieldBlur = (campoId: string, campo: Campo) => {
    const value = answers[campoId] || "";
    const result = validateField(campo, value);
    
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (!result.success && result.error) {
        newErrors[campoId] = result.error;
      } else {
        delete newErrors[campoId];
      }
      return newErrors;
    });
  };

  const handleCreatePatient = async (data: {
    name: string;
    gender: string;
    birthDate: string;
    followUpEmail: string;
  }): Promise<Patient> => {
    // Cria o paciente
    const newPatient = await createPatient(data);
    console.log(newPatient);
    
    // Define o paciente como pendente para seleção após atualização da lista
    setPendingPatientId(newPatient.id);
    // Retorna o paciente criado - a atualização da lista será feita por handlePatientsUpdate
    return newPatient;
  };

  const handlePatientsUpdate = async (): Promise<Patient[]> => {
    // Busca e atualiza a lista de pacientes
    const updatedPatients = await getPatients();
    // Usa uma função de atualização para garantir que o estado seja atualizado
    setPatients(() => updatedPatients);
    return updatedPatients;
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form) return;
    if (!selectedPatientId) {
      setError("Por favor, selecione ou crie um paciente");
      return;
    }

    // Valida todos os campos antes de submeter
    const allCampos: Campo[] = [];
    form.secoes.forEach((secao) => {
      allCampos.push(...secao.campos);
    });

    const validationResult = validateForm(allCampos, answers);

    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors);
      setError("Por favor, corrija os erros nos campos antes de salvar");

      // Scroll para o primeiro erro
      const firstErrorFieldId = Object.keys(validationResult.errors)[0];
      if (firstErrorFieldId) {
        setTimeout(() => {
          scrollToField(firstErrorFieldId);
        }, 100);
      }
      return;
    }

    const formAnswers: FormAnswer[] = [];

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoId = campo.id.toString();
        const answer = answers[campoId];

        if (answer !== undefined && answer !== "") {
          let questionType: "number" | "slider" | "text" = "text";
          if (campo.tipo === "numerico") {
            questionType = "number";
          } else if (
            campo.tipo === "texto" ||
            campo.tipo === "texto_longo" ||
            campo.tipo === "data" ||
            campo.tipo === "hora" ||
            campo.tipo === "data_hora" ||
            campo.tipo === "select" ||
            campo.tipo === "radio" ||
            campo.tipo === "checkbox" ||
            campo.tipo === "midia"
          ) {
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
          formId: form.id.toString(),
          formTitle: form.titulo,
          patientId: selectedPatientId,
          answers: formAnswers,
        });

        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar formulário");
      }
    });
  };

  if (!form) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {strapiError ? (
            <Alert variant="error">
              Erro ao carregar formulário: {strapiError.message}
            </Alert>
          ) : (
            <Card className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
                Nenhum formulário disponível
              </h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Não há formulários publicados no momento.
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8 pb-24 sm:pb-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {form.titulo}
              </h1>
              {form.descricao && (
                <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">
                  {form.descricao}
                </p>
              )}
            </div>
            {form.versao && (
              <div className="self-start rounded-lg bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                v{form.versao}
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

<PatientSelector
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientSelect={setSelectedPatientId}
            onCreatePatient={handleCreatePatient}
            onPatientsUpdate={handlePatientsUpdate}
            error={error}
          />

        <form onSubmit={handleSubmitForm} className="space-y-6 mt-6" id="main-form">
          {/* Seleção de Paciente */}
  

          {/* Seções do Formulário */}
          <div className="space-y-4 sm:space-y-6">
            {form.secoes.map((secao, index) => (
              <FormSection
                key={secao.id}
                secao={secao}
                index={index}
                answers={answers}
                fieldErrors={fieldErrors}
                onAnswerChange={handleAnswerChange}
                onFieldBlur={handleFieldBlur}
              />
            ))}
          </div>

          {/* Botão de Submit */}
          <div className="sticky bottom-0 left-0 right-0 z-10 rounded-t-xl sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-lg -mx-3 sm:mx-0">
            <ProgressBar
              value={filledFields}
              max={totalFields}
              label="Progresso"
            />
            <Button
              type="submit"
              disabled={isPending || !selectedPatientId}
              isLoading={isPending}
              className="mt-4 w-full"
              size="lg"
            >
              {isPending ? "Salvando..." : "Salvar Formulário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
