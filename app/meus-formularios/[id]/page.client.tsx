"use client";

import { useState } from "react";
import Link from "next/link";
import type { FormSubmissionWithAnswers } from "@/app/actions/form";

interface FormSubmissionViewProps {
  submission: FormSubmissionWithAnswers;
}

interface MediaPreviewProps {
  fileUrl: string;
  filename: string;
  questionText: string;
  isImage: boolean;
  isVideo: boolean;
}

function MediaPreview({ fileUrl, filename, questionText, isImage, isVideo }: MediaPreviewProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-6 text-center">
        <svg
          className="mx-auto mb-2 h-12 w-12 text-[var(--muted-foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isImage ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          )}
        </svg>
        <p className="text-sm text-[var(--muted-foreground)]">
          {isImage ? "Imagem" : "Vídeo"} não disponível
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{filename}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      {isImage ? (
        <img
          src={fileUrl}
          alt={questionText}
          className="max-h-96 w-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <video
          src={fileUrl}
          controls
          className="max-h-96 w-full"
          onError={() => setHasError(true)}
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      )}
    </div>
  );
}

export default function FormSubmissionView({
  submission,
}: FormSubmissionViewProps) {
  // Agrupa respostas por seção (assumindo que podemos inferir da estrutura)
  // Por enquanto, vamos mostrar todas as respostas de forma organizada

  // Verifica se uma string é uma URL de imagem (por extensão ou data URL)
  const isImageFile = (filename: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
    return imageExtensions.test(filename) || filename.startsWith("data:image/");
  };

  // Verifica se uma string é uma URL de vídeo (por extensão)
  const isVideoFile = (filename: string): boolean => {
    const videoExtensions = /\.(mp4|webm|ogg|ogv|mov|avi|wmv|flv|mkv)(\?.*)?$/i;
    return videoExtensions.test(filename);
  };

  // Verifica se é uma URL válida (http/https ou caminho absoluto)
  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return str.startsWith("/") || str.startsWith("./") || str.startsWith("../");
    }
  };

  const formatAnswer = (answer: string, questionType: string, questionText: string) => {
    if (!answer || answer.trim() === "") {
      return <span className="text-[var(--muted-foreground)] italic">Não respondido</span>;
    }

    // Se for checkbox (valores separados por vírgula)
    if (answer.includes(",") && !answer.includes("http") && !answer.includes("/")) {
      const values = answer.split(",").filter(v => v.trim() !== "");
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

    // Se for tipo midia e for imagem ou vídeo (detecta pela extensão do nome do arquivo)
    if (questionType === "text" && (isImageFile(answer) || isVideoFile(answer))) {
      const isImage = isImageFile(answer);
      const isVideo = isVideoFile(answer);
      // Se for URL completa, usa diretamente; caso contrário, tenta como caminho relativo
      const fileUrl = isUrl(answer) ? answer : `/uploads/${answer}`;

      return (
        <div className="space-y-3">
          {/* Nome do arquivo */}
          <div className="text-sm text-[var(--muted-foreground)]">
            Arquivo: <span className="font-medium text-[var(--foreground)]">{answer}</span>
          </div>

          {/* Preview da mídia */}
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
  };

  const getAnswerLabel = (questionType: string) => {
    switch (questionType) {
      case "number":
        return "Número";
      case "slider":
        return "Slider";
      case "text":
      default:
        return "Texto";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/meus-formularios"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
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
            {new Date(
              submission.createdAt instanceof Date
                ? submission.createdAt
                : submission.createdAt
            ).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Respostas */}
        <div className="space-y-6">
          {submission.answers.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
              <p className="text-center text-[var(--muted-foreground)]">
                Nenhuma resposta encontrada para este formulário.
              </p>
            </div>
          ) : (
            submission.answers.map((answer, index) => (
              <div
                key={`${answer.questionId}-${index}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              >
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

