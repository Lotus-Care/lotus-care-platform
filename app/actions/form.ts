"use server";

import { db } from "@/db";
import { patient, formSubmission, formResponse } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "./auth";
import type {
  FormAnswer,
  CreateDraftSubmissionData,
  SaveFormSubmissionData,
  FormSubmission,
  FormSubmissionWithPatient,
} from "@/types/form";

/**
 * Creates a new draft form submission (no answers yet).
 * Called when user selects a patient and starts filling the form.
 */
export async function createDraftSubmission(
  data: CreateDraftSubmissionData
): Promise<FormSubmission> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  // Verifica se o paciente pertence ao usuário
  const [existingPatient] = await db
    .select()
    .from(patient)
    .where(eq(patient.id, data.patientId))
    .limit(1);

  if (!existingPatient || existingPatient.userId !== userId) {
    throw new Error("Paciente não encontrado ou não autorizado");
  }

  const submissionId = randomUUID();
  const [submission] = await db
    .insert(formSubmission)
    .values({
      id: submissionId,
      formId: data.formId,
      formTitle: data.formTitle,
      userId,
      patientId: data.patientId,
      status: "draft",
    })
    .returning();

  return {
    id: submission.id,
    formId: submission.formId,
    formTitle: submission.formTitle,
    patientId: submission.patientId,
    status: submission.status as "draft" | "finalized",
    finalizedAt: submission.finalizedAt,
    checkupEndTime: submission.checkupEndTime,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

/**
 * Auto-saves all responses for a draft submission.
 * Replaces all existing responses with the current set.
 */
export async function autoSaveResponses(
  submissionId: string,
  answers: FormAnswer[]
): Promise<void> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  // Verifica se a submissão pertence ao usuário e está em draft
  const [submission] = await db
    .select()
    .from(formSubmission)
    .where(eq(formSubmission.id, submissionId))
    .limit(1);

  if (!submission || submission.userId !== userId) {
    throw new Error("Submissão não encontrada ou não autorizada");
  }

  if (submission.status !== "draft") {
    throw new Error("Formulário já finalizado, não pode ser editado");
  }

  // Deleta todas as respostas existentes e insere as novas
  await db
    .delete(formResponse)
    .where(eq(formResponse.submissionId, submissionId));

  if (answers.length > 0) {
    await db.insert(formResponse).values(
      answers.map((answer) => ({
        id: randomUUID(),
        submissionId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        questionType: answer.questionType,
        answer: answer.answer,
      }))
    );
  }

  // Atualiza o updatedAt da submissão
  await db
    .update(formSubmission)
    .set({ updatedAt: new Date() })
    .where(eq(formSubmission.id, submissionId));
}

/**
 * Updates the patient for a draft submission.
 */
export async function updateDraftPatient(
  submissionId: string,
  patientId: string
): Promise<void> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [submission] = await db
    .select()
    .from(formSubmission)
    .where(eq(formSubmission.id, submissionId))
    .limit(1);

  if (!submission || submission.userId !== userId) {
    throw new Error("Submissão não encontrada ou não autorizada");
  }

  if (submission.status !== "draft") {
    throw new Error("Formulário já finalizado, não pode ser editado");
  }

  // Verifica se o paciente pertence ao usuário
  const [existingPatient] = await db
    .select()
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);

  if (!existingPatient || existingPatient.userId !== userId) {
    throw new Error("Paciente não encontrado ou não autorizado");
  }

  await db
    .update(formSubmission)
    .set({ patientId, updatedAt: new Date() })
    .where(eq(formSubmission.id, submissionId));
}

/**
 * Finalizes a form submission. After this, it cannot be edited.
 * If checkupEndTime is not provided, defaults to the finalization time.
 */
export async function finalizeFormSubmission(
  submissionId: string,
  checkupEndTime?: string
): Promise<FormSubmission> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [submission] = await db
    .select()
    .from(formSubmission)
    .where(eq(formSubmission.id, submissionId))
    .limit(1);

  if (!submission || submission.userId !== userId) {
    throw new Error("Submissão não encontrada ou não autorizada");
  }

  if (submission.status !== "draft") {
    throw new Error("Formulário já finalizado");
  }

  const now = new Date();
  const checkupEnd = checkupEndTime ? new Date(checkupEndTime) : now;

  const [updated] = await db
    .update(formSubmission)
    .set({
      status: "finalized",
      finalizedAt: now,
      checkupEndTime: checkupEnd,
      updatedAt: now,
    })
    .where(eq(formSubmission.id, submissionId))
    .returning();

  return {
    id: updated.id,
    formId: updated.formId,
    formTitle: updated.formTitle,
    patientId: updated.patientId,
    status: updated.status as "draft" | "finalized",
    finalizedAt: updated.finalizedAt,
    checkupEndTime: updated.checkupEndTime,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Legacy: saves a form submission in one go (creates + adds answers + finalizes).
 * Kept for backwards compatibility.
 */
export async function saveFormSubmission(
  data: SaveFormSubmissionData
): Promise<FormSubmission> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [existingPatient] = await db
    .select()
    .from(patient)
    .where(eq(patient.id, data.patientId))
    .limit(1);

  if (!existingPatient || existingPatient.userId !== userId) {
    throw new Error("Paciente não encontrado ou não autorizado");
  }

  const submissionId = randomUUID();
  const now = new Date();
  const [submission] = await db
    .insert(formSubmission)
    .values({
      id: submissionId,
      formId: data.formId,
      formTitle: data.formTitle,
      userId,
      patientId: data.patientId,
      status: "finalized",
      finalizedAt: now,
      checkupEndTime: now,
    })
    .returning();

  if (data.answers.length > 0) {
    await db.insert(formResponse).values(
      data.answers.map((answer) => ({
        id: randomUUID(),
        submissionId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        questionType: answer.questionType,
        answer: answer.answer,
      }))
    );
  }

  return {
    id: submission.id,
    formId: submission.formId,
    formTitle: submission.formTitle,
    patientId: submission.patientId,
    status: submission.status as "draft" | "finalized",
    finalizedAt: submission.finalizedAt,
    checkupEndTime: submission.checkupEndTime,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

export async function getFormSubmissionsByPatient(
  patientId: string
): Promise<FormSubmission[]> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [existingPatient] = await db
    .select()
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);

  if (!existingPatient || existingPatient.userId !== userId) {
    throw new Error("Paciente não encontrado ou não autorizado");
  }

  const submissions = await db
    .select({
      id: formSubmission.id,
      formId: formSubmission.formId,
      formTitle: formSubmission.formTitle,
      patientId: formSubmission.patientId,
      status: formSubmission.status,
      finalizedAt: formSubmission.finalizedAt,
      checkupEndTime: formSubmission.checkupEndTime,
      createdAt: formSubmission.createdAt,
      updatedAt: formSubmission.updatedAt,
    })
    .from(formSubmission)
    .where(eq(formSubmission.patientId, patientId))
    .orderBy(desc(formSubmission.createdAt));

  return submissions as FormSubmission[];
}

export async function getAllFormSubmissions(): Promise<
  FormSubmissionWithPatient[]
> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const submissions = await db
    .select({
      id: formSubmission.id,
      formId: formSubmission.formId,
      formTitle: formSubmission.formTitle,
      patientId: formSubmission.patientId,
      patientName: patient.name,
      status: formSubmission.status,
      finalizedAt: formSubmission.finalizedAt,
      checkupEndTime: formSubmission.checkupEndTime,
      createdAt: formSubmission.createdAt,
      updatedAt: formSubmission.updatedAt,
    })
    .from(formSubmission)
    .innerJoin(patient, eq(formSubmission.patientId, patient.id))
    .where(eq(formSubmission.userId, userId))
    .orderBy(desc(formSubmission.createdAt));

  return submissions as FormSubmissionWithPatient[];
}

export interface FormSubmissionWithAnswers extends FormSubmissionWithPatient {
  answers: FormAnswer[];
}

export async function getFormSubmissionById(
  submissionId: string
): Promise<FormSubmissionWithAnswers | null> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [submission] = await db
    .select({
      id: formSubmission.id,
      formId: formSubmission.formId,
      formTitle: formSubmission.formTitle,
      patientId: formSubmission.patientId,
      patientName: patient.name,
      userId: formSubmission.userId,
      status: formSubmission.status,
      finalizedAt: formSubmission.finalizedAt,
      checkupEndTime: formSubmission.checkupEndTime,
      createdAt: formSubmission.createdAt,
      updatedAt: formSubmission.updatedAt,
    })
    .from(formSubmission)
    .innerJoin(patient, eq(formSubmission.patientId, patient.id))
    .where(eq(formSubmission.id, submissionId))
    .limit(1);

  if (!submission || submission.userId !== userId) {
    return null;
  }

  const responses = await db
    .select()
    .from(formResponse)
    .where(eq(formResponse.submissionId, submissionId));

  const answers: FormAnswer[] = responses.map((response) => ({
    questionId: response.questionId,
    questionText: response.questionText,
    questionType: response.questionType as "number" | "slider" | "text",
    answer: response.answer,
  }));

  const { userId: _, ...submissionWithoutUserId } = submission;

  return {
    ...submissionWithoutUserId,
    status: submissionWithoutUserId.status as "draft" | "finalized",
    answers,
  };
}

/**
 * Gets a draft submission's responses (for loading into the form editor).
 */
export async function getDraftSubmissionWithAnswers(
  submissionId: string
): Promise<{ submission: FormSubmission; answers: Record<string, string> } | null> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const [submission] = await db
    .select()
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.id, submissionId),
        eq(formSubmission.userId, userId)
      )
    )
    .limit(1);

  if (!submission) {
    return null;
  }

  const responses = await db
    .select()
    .from(formResponse)
    .where(eq(formResponse.submissionId, submissionId));

  const answers: Record<string, string> = {};
  for (const response of responses) {
    answers[response.questionId] = response.answer;
  }

  return {
    submission: {
      id: submission.id,
      formId: submission.formId,
      formTitle: submission.formTitle,
      patientId: submission.patientId,
      status: submission.status as "draft" | "finalized",
      finalizedAt: submission.finalizedAt,
      checkupEndTime: submission.checkupEndTime,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    },
    answers,
  };
}
