import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPatients } from "@/app/actions";
import PatientsClient from "./page.client";

export default async function PatientsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  const patients = await getPatients();

  return <PatientsClient initialPatients={patients} />;
}

