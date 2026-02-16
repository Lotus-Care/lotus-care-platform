import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getForms } from "@/lib/strapi";
import { getPatients } from "@/app/actions";
import { getDraftSubmissionWithAnswers } from "@/app/actions/form";
import FormsClient from "./page.client";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string }>;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  const { submission: submissionId } = await searchParams;

  const [formsResult, patients] = await Promise.all([
    getForms(),
    getPatients(),
  ]);

  const forms = formsResult.data || [];
  
  // Pega o primeiro formulário (já vem ordenado por publishedAt:desc do Strapi)
  const latestForm = forms.length > 0 ? forms[0] : null;

  // Se tem um submissionId, carrega o rascunho existente
  let draftData: { submissionId: string; patientId: string; answers: Record<string, string> } | null = null;
  
  if (submissionId) {
    const draft = await getDraftSubmissionWithAnswers(submissionId);
    if (draft && draft.submission.status === "draft") {
      draftData = {
        submissionId: draft.submission.id,
        patientId: draft.submission.patientId,
        answers: draft.answers,
      };
    }
  }

  return (
    <FormsClient
      initialForm={latestForm}
      initialPatients={patients}
      strapiError={formsResult.error}
      userName={session.user.name || ""}
      draftData={draftData}
    />
  );
}
