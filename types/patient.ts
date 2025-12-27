import type { patient } from "@/db/schema";

// Patient Types
export type Patient = typeof patient.$inferSelect;
export type PatientInsert = typeof patient.$inferInsert;

export interface CreatePatientData {
  name: string;
  gender?: string;
  birthDate?: string;
  followUpEmail?: string;
}

export interface UpdatePatientData {
  name?: string;
  gender?: string;
  birthDate?: string;
  followUpEmail?: string;
}

