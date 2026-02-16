// Form Types
export type FormStatus = "draft" | "finalized";

export interface FormAnswer {
  questionId: string;
  questionText: string;
  questionType: "number" | "slider" | "text";
  answer: string;
}

export interface CreateDraftSubmissionData {
  formId: string;
  formTitle: string;
  patientId: string;
}

export interface SaveFormSubmissionData {
  formId: string;
  formTitle: string;
  patientId: string;
  answers: FormAnswer[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  patientId: string;
  status: FormStatus;
  finalizedAt: Date | null;
  checkupEndTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmissionWithPatient extends FormSubmission {
  patientName: string;
}
