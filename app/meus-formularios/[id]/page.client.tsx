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

          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {submission.formTitle}
            </h1>
            <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-medium text-[var(--primary)]">
              {submission.patientName}
            </span>
          </div>

          <p className="text-sm text-[var(--muted-foreground)]">
            Enviado em{" "}
            {formatDateForDisplay(
              submission.createdAt instanceof Date
                ? submission.createdAt
                : submission.createdAt
            )}
          </p>
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
