// Strapi Types
export interface Alerta {
  id: number;
  Gravidade?: number; // 0-100: 0 = menos grave (amarelo), 100 = mais grave (vermelho). Opcional para compatibilidade
  Valor: number;
  avisar_quando: "Valor for Acima" | "Valor for Abaixo" | "Valor for Igual" | "Valor for Igual ou Acima" | "Valor for Igual ou Abaixo ";
  Mensagem: string;
}

export interface Campo {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: "texto" | "texto_longo" | "numerico" | "midia" | "checkbox" | "radio" | "select" | "data" | "hora" | "data_hora";
  obrigatorio: boolean;
  placeholder?: string;
  ordem?: number;
  alertas?: Alerta[];
  valor_minimo?: number;
  valor_maximo?: number;
  opcoes?: string | string[] | { label: string; value: string }[]; // JSON string ou array de opções para select/radio/checkbox
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

