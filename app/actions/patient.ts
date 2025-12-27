"use server";

import { db } from "@/db";
import { patient } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "./auth";
import type {
  CreatePatientData,
  UpdatePatientData,
  Patient,
} from "@/types/patient";

export async function getPatients(): Promise<Patient[]> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  const patients = await db
    .select()
    .from(patient)
    .where(eq(patient.userId, userId))
    .orderBy(desc(patient.createdAt));

  return patients;
}

export async function createPatient(
  data: CreatePatientData
): Promise<Patient> {
  const userId = await getCurrentUser();
  if (!userId) {
    throw new Error("Não autenticado");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("Nome é obrigatório");
  }

  const newPatient = await db
    .insert(patient)
    .values({
      id: randomUUID(),
      name: data.name.trim(),
      gender: data.gender || null,
      birthDate: data.birthDate || null,
      followUpEmail: data.followUpEmail || null,
      userId,
    })
    .returning();

  return newPatient[0];
}

export async function updatePatient(
  patientId: string,
  data: UpdatePatientData
): Promise<Patient> {
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

  const updateData: Partial<typeof patient.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    if (!data.name || data.name.trim() === "") {
      throw new Error("Nome não pode ser vazio");
    }
    updateData.name = data.name.trim();
  }
  if (data.gender !== undefined) updateData.gender = data.gender || null;
  if (data.birthDate !== undefined)
    updateData.birthDate = data.birthDate || null;
  if (data.followUpEmail !== undefined)
    updateData.followUpEmail = data.followUpEmail || null;

  const updated = await db
    .update(patient)
    .set(updateData)
    .where(eq(patient.id, patientId))
    .returning();

  return updated[0];
}

export async function deletePatient(patientId: string): Promise<void> {
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

  await db.delete(patient).where(eq(patient.id, patientId));
}

