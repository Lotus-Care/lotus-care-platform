import axios from "axios";
import type {
  Form,
  FormResponse,
  StrapiFormResponse,
} from "@/types/strapi";
import type {
  PartnerData,
  StrapiPartnerResponse,
} from "@/types/partner";

const api = axios.create({
  baseURL: process.env.STRAPI_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
  },
});

/**
 * Busca informações de uma parceria no Strapi pelo slug
 */
export async function getPartnerBySlug(
  slug: string
): Promise<StrapiPartnerResponse> {
  try {
    const url = `/api/parceiros?filters[slug][$eq]=${slug}&populate=logo`;

    const { data: json } = await api.get(url);

    // Strapi retorna um array de dados
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      const partner = json.data[0];

      // Verifica se a parceria está ativa
      if (!partner) {
        return {
          data: null,
          error: {
            status: 404,
            message: "Parceria não está ativa",
          },
        };
      }

      return {
        data: partner,
      };
    }

    return {
      data: null,
      error: {
        status: 404,
        message: "Parceria não encontrada",
      },
    };
  } catch (error) {
    console.error("Erro ao buscar parceria no Strapi:", error);
    return {
      data: null,
      error: {
        status: 500,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
    };
  }
}

/**
 * Formata a URL do logo da parceria
 */
export function getPartnerLogoUrl(
  partner: PartnerData | null
): string | null {
  if (!partner?.logo?.url) {
    return null;
  }

  const logoUrl = partner.logo.url;
  const strapiUrl = process.env.STRAPI_URL;

  // Se já é uma URL completa, retorna como está
  if (logoUrl.startsWith("http")) {
    return logoUrl;
  }

  // Se é uma URL relativa, adiciona a base do Strapi
  if (strapiUrl) {
    return `${strapiUrl}${logoUrl}`;
  }

  return logoUrl;
}

// Re-export types for backward compatibility
export type {
  Alerta,
  Campo,
  Secao,
  Form,
  FormResponse,
  StrapiFormResponse,
  FormQuestion,
} from "@/types/strapi";

/**
 * Busca todos os formulários disponíveis no Strapi
 */
export async function getForms(): Promise<StrapiFormResponse> {
  try {
    const { data } = await api.get<FormResponse>(
      "/api/formularios?populate=secoes.campos.alertas"
    );

    // Filtra apenas formulários ativos (se o campo existir)
    const activeForms = data.data?.filter((form) => form.ativo !== false) || [];

    return {
      data: activeForms.length > 0 ? activeForms : null,
    };
  } catch (error) {
    console.error("Erro ao buscar formulários no Strapi:", error);

    if (axios.isAxiosError(error)) {
      return {
        data: null,
        error: {
          status: error.response?.status || 500,
          message: error.response?.data?.error?.message || error.message,
        },
      };
    }

    return {
      data: null,
      error: {
        status: 500,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
    };
  }
}

/**
 * Busca um formulário específico pelo ID no Strapi
 */
export async function getFormById(
  formId: string | number
): Promise<StrapiFormResponse> {
  try {
    const response = await api.get<{ data: Form }>(
      `/api/formularios/${formId}?populate=secoes.campos.alertas`
    );

    // Strapi retorna um objeto único quando busca por ID
    const formData = response.data.data;

    return {
      data: formData ? [formData] : null,
    };
  } catch (error) {
    console.error("Erro ao buscar formulário no Strapi:", error);

    if (axios.isAxiosError(error)) {
      return {
        data: null,
        error: {
          status: error.response?.status || 500,
          message: error.response?.data?.error?.message || error.message,
        },
      };
    }

    return {
      data: null,
      error: {
        status: 500,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
    };
  }
}
