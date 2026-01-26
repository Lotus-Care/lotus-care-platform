"use client";

import { useState } from "react";

interface MediaPreviewProps {
  fileUrl: string;
  filename: string;
  questionText: string;
  isImage: boolean;
  isVideo: boolean;
}

export default function MediaPreview({
  fileUrl,
  filename,
  questionText,
  isImage,
  isVideo,
}: MediaPreviewProps) {
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

