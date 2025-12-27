// Form Types
export interface FormAnswer {
  questionId: string;
  questionText: string;
  questionType: "number" | "slider" | "text";
  answer: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmissionWithPatient extends FormSubmission {
  patientName: string;
}

