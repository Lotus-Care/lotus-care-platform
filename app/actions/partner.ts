"use server";

import { getPartnerBySlug, getPartnerLogoUrl } from "@/lib/strapi";
import type { PartnerInfo } from "@/types/partner";

export async function getPartnerInfo(slug: string): Promise<PartnerInfo> {
  const result = await getPartnerBySlug(slug);

  if (!result.data || result.error) {
    throw new Error(result.error?.message || "Parceria não encontrada");
  }

  const logoUrl = getPartnerLogoUrl(result.data);

  return {
    name: result.data.nome,
    logo: logoUrl,
    slug: result.data.slug,
  };
}

