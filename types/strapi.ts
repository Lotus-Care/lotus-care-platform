// Strapi Types
export interface Alerta {
  id: number;
  Valor: number;
  avisar_quando: "Valor for Acima" | "Valor for Abaixo";
  Mensagem: string;
}

export interface Campo {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: "numerico" | "texto" | "slider";
  obrigatorio: boolean;
  placeholder?: string;
  ordem?: number;
  alertas?: Alerta[];
}

export interface Secao {
  id: number;
  titulo: string;
  descricao?: string;
  ordem?: number;
  campos: Campo[];
}

export interface Form {
  id: number;
  documentId: string;
  titulo: string;
  descricao?: string;
  versao?: string;
  ativo?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  secoes: Secao[];
}

export interface FormResponse {
  data: Form[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiFormResponse {
  data: Form[] | null;
  error?: {
    status: number;
    message: string;
  };
}

// Tipos legados para compatibilidade (deprecated)
export interface FormQuestion {
  id: number;
  attributes: {
    question: string;
    type: "number" | "slider" | "text";
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
}

