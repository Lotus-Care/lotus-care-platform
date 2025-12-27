import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAllFormSubmissions } from "@/app/actions";
import MyFormsClient from "./page.client";

export default async function MyFormsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  const submissions = await getAllFormSubmissions();

  return <MyFormsClient initialSubmissions={submissions} />;
}

