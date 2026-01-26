import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAllFormSubmissions } from "@/app/actions";
import { getPatients } from "@/app/actions/patient";
import MyFormsClient from "./page.client";

export default async function MyFormsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  const [submissions, patients] = await Promise.all([
    getAllFormSubmissions(),
    getPatients(),
  ]);

  return <MyFormsClient initialSubmissions={submissions} patients={patients} />;
}

