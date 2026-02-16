"use client";

import Link from "next/link";
import type { FormSubmissionWithAnswers } from "@/app/actions/form";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";
import { isImageFile, isVideoFile, isUrl } from "@/lib/utils/mediaUtils";
import MediaPreview from "@/app/components/forms/MediaPreview";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

interface FormSubmissionViewProps {
  submission: FormSubmissionWithAnswers;
}

function formatAnswer(
  answer: string,
  questionType: string,
  questionText: string
) {
  if (!answer || answer.trim() === "") {
    return (
      <span className="text-[var(--muted-foreground)] italic">
        Não respondido
      </span>
    );
  }

  // Se for checkbox (valores separados por vírgula)
  if (answer.includes(",") && !answer.includes("http") && !answer.includes("/")) {
    const values = answer.split(",").filter((v) => v.trim() !== "");
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value, idx) => (
          <span
            key={idx}
            className="rounded-lg bg-[var(--muted)] px-3 py-1 text-sm text-[var(--foreground)]"
          >
            {value.trim()}
          </span>
        ))}
      </div>
    );
  }

  // Se for tipo midia e for imagem ou vídeo
  if (
    questionType === "text" &&
    (isImageFile(answer) || isVideoFile(answer))
  ) {
    const isImage = isImageFile(answer);
    const isVideo = isVideoFile(answer);
    const fileUrl = isUrl(answer) ? answer : `/uploads/${answer}`;

    return (
      <div className="space-y-3">
        <div className="text-sm text-[var(--muted-foreground)]">
          Arquivo: <span className="font-medium text-[var(--foreground)]">{answer}</span>
        </div>
        <MediaPreview
          fileUrl={fileUrl}
          filename={answer}
          questionText={questionText}
          isImage={isImage}
          isVideo={isVideo}
        />
      </div>
    );
  }

  // Para outros tipos, mostra o valor diretamente
  return <span className="text-[var(--foreground)]">{answer}</span>;
}

function getAnswerLabel(questionType: string) {
  switch (questionType) {
    case "number":
      return "Número";
    case "slider":
      return "Slider";
    case "text":
    default:
      return "Texto";
  }
}

export default function FormSubmissionView({
  submission,
}: FormSubmissionViewProps) {
  const isDraft = submission.status === "draft";

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/meus-formularios">
            <Button variant="ghost" size="sm" className="mb-4">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Voltar para Meus Formulários
            </Button>
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {submission.formTitle}
            </h1>
            <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-medium text-[var(--primary)]">
              {submission.patientName}
            </span>
            {isDraft ? (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                Rascunho
              </span>
            ) : (
              <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                Finalizado
              </span>
            )}
          </div>

          {/* Timestamps */}
          <Card className="p-4 sm:p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Criado em
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {formatDateForDisplay(
                    submission.createdAt instanceof Date
                      ? submission.createdAt
                      : submission.createdAt
                  )}
                </p>
              </div>
              {submission.finalizedAt && (
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Finalizado em
                  </p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDateForDisplay(
                      submission.finalizedAt instanceof Date
                        ? submission.finalizedAt
                        : submission.finalizedAt
                    )}
                  </p>
                </div>
              )}
              {submission.checkupEndTime && (
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Fim de Checkup
                  </p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDateForDisplay(
                      submission.checkupEndTime instanceof Date
                        ? submission.checkupEndTime
                        : submission.checkupEndTime
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Edit button for drafts */}
          {isDraft && (
            <Link href={`/formularios?submission=${submission.id}`}>
              <Button variant="secondary" size="sm" className="mb-4">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Continuar Editando
              </Button>
            </Link>
          )}
        </div>

        {/* Respostas */}
        <div className="space-y-6">
          {submission.answers.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-[var(--muted-foreground)]">
                Nenhuma resposta encontrada para este formulário.
              </p>
            </Card>
          ) : (
            submission.answers.map((answer, index) => (
              <Card key={`${answer.questionId}-${index}`} className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {answer.questionText}
                    </h3>
                    <span className="mt-1 inline-block rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                      {getAnswerLabel(answer.questionType)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[var(--background)] p-4">
                  {formatAnswer(answer.answer, answer.questionType, answer.questionText)}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
