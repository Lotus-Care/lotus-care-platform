"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createDraftSubmission,
  autoSaveResponses,
  finalizeFormSubmission,
  updateDraftPatient,
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
import Input from "@/app/components/ui/Input";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface FormsClientProps {
  initialForm: Form | null;
  initialPatients: Patient[];
  strapiError?: { status: number; message: string };
  userName: string;
  draftData?: {
    submissionId: string;
    patientId: string;
    answers: Record<string, string>;
  } | null;
}

export default function FormsClient({
  initialForm,
  initialPatients,
  strapiError,
  userName,
  draftData,
}: FormsClientProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    draftData?.patientId || ""
  );
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(
    draftData?.answers || {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(
    draftData?.submissionId || null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [checkupEndTime, setCheckupEndTime] = useState<string>("");
  const router = useRouter();
  const { scrollToNextField } = useScrollToField();

  const form = initialForm;

  // Refs for debounced auto-save
  const answersRef = useRef(answers);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submissionIdRef = useRef(submissionId);

  // Keep refs in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

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

  // Seleciona automaticamente o primeiro paciente se disponível (only if no draft)
  useEffect(() => {
    if (!form) return;
    if (draftData) return; // Don't auto-select if loading a draft
    if (!selectedPatientId && patients.length > 0) {
      const timer = setTimeout(() => {
        setSelectedPatientId(patients[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [form, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seleciona o paciente pendente quando a lista for atualizada
  useEffect(() => {
    if (pendingPatientId && patients.some((p) => p.id === pendingPatientId)) {
      const timer = setTimeout(() => {
        setSelectedPatientId(pendingPatientId);
        setPendingPatientId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [patients, pendingPatientId]);

  /**
   * Converts current answers to FormAnswer array.
   */
  const buildFormAnswers = useCallback(
    (currentAnswers: Record<string, string>): FormAnswer[] => {
      if (!form) return [];
      const formAnswers: FormAnswer[] = [];

      form.secoes.forEach((secao) => {
        secao.campos.forEach((campo) => {
          const campoId = campo.id.toString();
          const answer = currentAnswers[campoId];

          if (answer !== undefined && answer !== "") {
            let questionType: "number" | "slider" | "text" = "text";
            if (campo.tipo === "numerico") {
              questionType = "number";
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

      return formAnswers;
    },
    [form]
  );

  /**
   * Performs the actual auto-save of responses.
   */
  const performAutoSave = useCallback(async () => {
    const currentSubmissionId = submissionIdRef.current;
    if (!currentSubmissionId) return;

    const currentAnswers = answersRef.current;
    const formAnswers = buildFormAnswers(currentAnswers);

    setSaveStatus("saving");
    try {
      await autoSaveResponses(currentSubmissionId, formAnswers);
      setSaveStatus("saved");
      toast.success("Rascunho salvo", {
        duration: 2000,
      });
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch {
      setSaveStatus("error");
      toast.error("Erro ao salvar rascunho");
    }
  }, [buildFormAnswers]);

  /**
   * Triggers a debounced auto-save.
   */
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500);
  }, [performAutoSave]);

  /**
   * Creates a draft submission if one doesn't exist yet.
   */
  const ensureDraftExists = useCallback(
    async (patientId: string): Promise<string | null> => {
      if (submissionIdRef.current) return submissionIdRef.current;
      if (!form) return null;

      try {
        const draft = await createDraftSubmission({
          formId: form.id.toString(),
          formTitle: form.titulo,
          patientId,
        });
        setSubmissionId(draft.id);
        submissionIdRef.current = draft.id;
        return draft.id;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao criar rascunho"
        );
        return null;
      }
    },
    [form]
  );

  const handlePatientSelect = useCallback(
    async (patientId: string) => {
      setSelectedPatientId(patientId);

      // If there's already a draft, update its patient
      if (submissionIdRef.current) {
        try {
          await updateDraftPatient(submissionIdRef.current, patientId);
        } catch {
          // If updating fails, ignore silently
        }
      }
    },
    []
  );

  const handleAnswerChange = async (
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
      if (
        newErrors[campoId]?.includes("mínimo") ||
        newErrors[campoId]?.includes("máximo")
      ) {
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

    // Ensure draft exists and trigger auto-save
    if (selectedPatientId) {
      await ensureDraftExists(selectedPatientId);
      triggerAutoSave();
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
    const newPatient = await createPatient(data);
    setPendingPatientId(newPatient.id);
    return newPatient;
  };

  const handlePatientsUpdate = async (): Promise<Patient[]> => {
    const updatedPatients = await getPatients();
    setPatients(() => updatedPatients);
    return updatedPatients;
  };

  const handleFinalizeForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form) return;
    if (!selectedPatientId) {
      setError("Por favor, selecione ou crie um paciente");
      return;
    }

    // Valida todos os campos antes de finalizar
    const allCampos: Campo[] = [];
    form.secoes.forEach((secao) => {
      allCampos.push(...secao.campos);
    });

    const validationResult = validateForm(allCampos, answers);

    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors);
      setError("Por favor, corrija os erros nos campos antes de finalizar");

      const firstErrorFieldId = Object.keys(validationResult.errors)[0];
      if (firstErrorFieldId) {
        setTimeout(() => {
          scrollToField(firstErrorFieldId);
        }, 100);
      }
      return;
    }

    startTransition(async () => {
      try {
        // Ensure draft exists
        const draftId = await ensureDraftExists(selectedPatientId);
        if (!draftId) {
          setError("Erro ao criar formulário");
          return;
        }

        // Do a final save of all responses before finalizing
        const formAnswers = buildFormAnswers(answers);
        await autoSaveResponses(draftId, formAnswers);

        // Finalize the submission
        await finalizeFormSubmission(
          draftId,
          checkupEndTime || undefined
        );

        router.push("/meus-formularios");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao finalizar formulário"
        );
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  {form.titulo}
                </h1>
                {submissionId && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Rascunho
                  </span>
                )}
              </div>
              {form.descricao && (
                <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">
                  {form.descricao}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 self-start">
              {/* Save status indicator */}
              <SaveStatusIndicator status={saveStatus} />
              {form.versao && (
                <div className="rounded-lg bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                  v{form.versao}
                </div>
              )}
            </div>
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
          onPatientSelect={handlePatientSelect}
          onCreatePatient={handleCreatePatient}
          onPatientsUpdate={handlePatientsUpdate}
          error={error}
        />

        <form
          onSubmit={handleFinalizeForm}
          className="space-y-6 mt-6"
          id="main-form"
        >
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

          {/* Fim de Checkup */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-3">
              Fim de Checkup
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-4">
              Opcionalmente, defina a hora de fim do checkup. Se não preencher,
              será usada a hora de finalização do formulário.
            </p>
            <Input
              type="datetime-local"
              value={checkupEndTime}
              onChange={(e) => setCheckupEndTime(e.target.value)}
              label="Data/Hora de fim do checkup"
              helperText="Deixe em branco para usar a hora de finalização"
            />
          </Card>

          {/* Botão de Finalizar */}
          <div className="sticky bottom-0 left-0 right-0 z-10 rounded-t-xl sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-lg -mx-3 sm:mx-0">
            <ProgressBar
              value={filledFields}
              max={totalFields}
              label="Progresso"
            />
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 text-xs sm:text-sm text-[var(--muted-foreground)]">
                {submissionId ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    Rascunho salvo automaticamente
                  </span>
                ) : (
                  <span>Selecione um paciente e preencha o formulário</span>
                )}
              </div>
              <Button
                type="submit"
                disabled={isPending || !selectedPatientId}
                isLoading={isPending}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isPending ? "Finalizando..." : "Finalizar Formulário"}
              </Button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: {
      text: "Salvando...",
      className:
        "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
      icon: (
        <svg
          className="h-3 w-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
    },
    saved: {
      text: "Salvo",
      className:
        "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      text: "Erro ao salvar",
      className:
        "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const c = config[status];

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${c.className}`}
    >
      {c.icon}
      {c.text}
    </div>
  );
}
