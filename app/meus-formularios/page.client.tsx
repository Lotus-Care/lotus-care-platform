"use client";

import type { FormSubmissionWithPatient } from "@/types/form";

interface MyFormsClientProps {
  initialSubmissions: FormSubmissionWithPatient[];
}

export default function MyFormsClient({
  initialSubmissions,
}: MyFormsClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Meus Formulários
        </h1>

        {initialSubmissions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Nenhum formulário enviado ainda. Acesse a página de Formulários
              para começar a preencher.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {submission.formTitle}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {submission.patientName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

