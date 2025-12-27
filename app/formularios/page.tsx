import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getForms } from "@/lib/strapi";
import { getPatients } from "@/app/actions";
import FormsClient from "./page.client";

export default async function FormsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  const [formsResult, patients] = await Promise.all([
    getForms(),
    getPatients(),
  ]);

  const forms = formsResult.data || [];

  return (
    <FormsClient
      initialForms={forms}
      initialPatients={patients}
      strapiError={formsResult.error}
    />
  );
}

