"use server";

import { db } from "@/db";
import { patient, formSubmission, formResponse } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "./auth";
import type {
  FormAnswer,
  SaveFormSubmissionData,
  FormSubmission,
  FormSubmissionWithPatient,
} from "@/types/form";

export async function saveFormSubmission(
  data: SaveFormSubmissionData
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

  // Cria a submissão do formulário
  const submissionId = randomUUID();
  const [submission] = await db
    .insert(formSubmission)
    .values({
      id: submissionId,
      formId: data.formId,
      formTitle: data.formTitle,
      userId,
      patientId: data.patientId,
    })
    .returning();

  // Insere as respostas
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

  return submission;
}

export async function getFormSubmissionsByPatient(
  patientId: string
): Promise<FormSubmission[]> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
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

  const submissions = await db
    .select({
      id: formSubmission.id,
      formId: formSubmission.formId,
      formTitle: formSubmission.formTitle,
      patientId: formSubmission.patientId,
      createdAt: formSubmission.createdAt,
      updatedAt: formSubmission.updatedAt,
    })
    .from(formSubmission)
    .where(eq(formSubmission.patientId, patientId))
    .orderBy(desc(formSubmission.createdAt));

  return submissions;
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
      createdAt: formSubmission.createdAt,
      updatedAt: formSubmission.updatedAt,
    })
    .from(formSubmission)
    .innerJoin(patient, eq(formSubmission.patientId, patient.id))
    .where(eq(formSubmission.userId, userId))
    .orderBy(desc(formSubmission.createdAt));

  return submissions;
}

