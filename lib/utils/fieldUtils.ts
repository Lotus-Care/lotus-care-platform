import type { Campo } from "@/types/strapi";

/**
 * Retorna o valor mínimo de um campo ou undefined se não houver limitação
 */
export function getMinValue(campo: Campo): number | undefined {
  return campo.valor_minimo != null ? campo.valor_minimo : undefined;
}

/**
 * Retorna o valor máximo de um campo ou undefined se não houver limitação
 */
export function getMaxValue(campo: Campo): number | undefined {
  return campo.valor_maximo != null ? campo.valor_maximo : undefined;
}

/**
 * Verifica se um campo é "pequeno" e pode ser colocado em grid
 */
export function isSmallField(campo: Campo): boolean {
  // Campos que sempre ocupam linha inteira
  if (
    campo.tipo === "texto_longo" ||
    campo.tipo === "midia" ||
    campo.tipo === "checkbox" ||
    campo.tipo === "radio"
  ) {
    return false;
  }

  // Campos com descrição muito longa ocupam linha inteira
  if (campo.descricao && campo.descricao.length > 80) return false;

  // Campos numéricos, texto, data, hora, select são pequenos
  return (
    campo.tipo === "numerico" ||
    campo.tipo === "texto" ||
    campo.tipo === "data" ||
    campo.tipo === "hora" ||
    campo.tipo === "select"
  );
}

/**
 * Parseia as opções do campo (pode vir como JSON string ou array)
 */
export function parseOpcoes(
  opcoes?: string | string[] | { label: string; value: string }[]
): { label: string; value: string }[] {
  if (!opcoes) return [];

  // Se já é um array de objetos
  if (Array.isArray(opcoes)) {
    // Se é array de strings, converte para objetos
    if (opcoes.length > 0 && typeof opcoes[0] === "string") {
      return (opcoes as string[]).map((opt) => ({ label: opt, value: opt }));
    }
    // Se já é array de objetos, valida e retorna
    if (
      opcoes.length > 0 &&
      typeof opcoes[0] === "object" &&
      opcoes[0] !== null &&
      "label" in opcoes[0] &&
      "value" in opcoes[0]
    ) {
      return opcoes as { label: string; value: string }[];
    }
    return [];
  }

  // Se é string JSON, tenta parsear
  if (typeof opcoes === "string") {
    try {
      const parsed = JSON.parse(opcoes);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          return parsed.map((opt: string) => ({ label: opt, value: opt }));
        }
        if (
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          parsed[0] !== null &&
          "label" in parsed[0] &&
          "value" in parsed[0]
        ) {
          return parsed as { label: string; value: string }[];
        }
      }
    } catch {
      // Se não conseguir parsear, trata como string única
      return [{ label: opcoes, value: opcoes }];
    }
  }

  return [];
}

/**
 * Agrupa campos consecutivos pequenos para renderização em grid
 */
export function groupFieldsForGrid(campos: Campo[]) {
  const groups: Array<{ type: "grid" | "single"; fields: Campo[] }> = [];
  let currentGroup: Campo[] = [];
  let currentType: "grid" | "single" | null = null;

  campos.forEach((campo) => {
    const fieldType = isSmallField(campo) ? "grid" : "single";

    if (currentType === null) {
      currentType = fieldType;
      currentGroup = [campo];
    } else if (currentType === fieldType && fieldType === "grid") {
      // Continua agrupando campos pequenos
      currentGroup.push(campo);
    } else {
      // Finaliza grupo anterior e inicia novo
      if (currentGroup.length > 0) {
        groups.push({ type: currentType, fields: currentGroup });
      }
      currentType = fieldType;
      currentGroup = [campo];
    }
  });

  // Adiciona último grupo
  if (currentGroup.length > 0 && currentType) {
    groups.push({ type: currentType, fields: currentGroup });
  }

  return groups;
}

