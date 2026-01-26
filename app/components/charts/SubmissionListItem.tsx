import { formatDateShort } from "@/lib/utils/dateUtils";
import type { FormSubmissionWithPatient } from "@/types/form";

interface SubmissionListItemProps {
  submission: FormSubmissionWithPatient;
}

export default function SubmissionListItem({
  submission,
}: SubmissionListItemProps) {
  const date = new Date(submission.createdAt);

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
      <div className="flex-1">
        <h3 className="font-medium text-[var(--foreground)]">
          {submission.formTitle}
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Paciente: {submission.patientName}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {formatDateShort(date)}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

