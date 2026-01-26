import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getFormSubmissionById } from "@/app/actions/form";
import FormSubmissionView from "./page.client";

export default async function FormSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  const { id } = await params;
  if (!session) {
    redirect("/login");
  }

  const submission = await getFormSubmissionById(id);

  if (!submission) {
    redirect("/meus-formularios");
  }

  return <FormSubmissionView submission={submission} />;
}

