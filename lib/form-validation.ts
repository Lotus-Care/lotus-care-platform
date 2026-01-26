import type { Campo } from "@/types/strapi";

/**
 * Schema de validação para campos do formulário
 * Compatível com Zod mas usando validação manual
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Valida um valor de campo baseado nas regras do campo
 */
export function validateField(campo: Campo, value: string): ValidationResult {
  // Campo obrigatório vazio
  if (campo.obrigatorio && (!value || value.trim() === "")) {
    return {
      success: false,
      error: "Este campo é obrigatório",
    };
  }

  // Se campo está vazio e não é obrigatório, é válido
  if (!value || value.trim() === "") {
    return { success: true };
  }

  // Validação para campos numéricos e slider
  if (campo.tipo === "numerico" || campo.tipo === "slider") {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return {
        success: false,
        error: "Por favor, insira um número válido",
      };
    }

    // Se valor_minimo for null, não há limitação mínima
    if (campo.valor_minimo != null && numValue < campo.valor_minimo) {
      return {
        success: false,
        error: `O valor mínimo é ${campo.valor_minimo}`,
      };
    }

    // Se valor_maximo for null, não há limitação máxima
    if (campo.valor_maximo != null && numValue > campo.valor_maximo) {
      return {
        success: false,
        error: `O valor máximo é ${campo.valor_maximo}`,
      };
    }
  }

  // Validação para campos de texto e texto longo (min/max de caracteres)
  if (campo.tipo === "texto" || campo.tipo === "texto_longo") {
    // Se valor_minimo for null, não há limitação mínima
    if (campo.valor_minimo != null && value.length < campo.valor_minimo) {
      return {
        success: false,
        error: `Mínimo de ${campo.valor_minimo} caracteres`,
      };
    }

    // Se valor_maximo for null, não há limitação máxima
    if (campo.valor_maximo != null && value.length > campo.valor_maximo) {
      return {
        success: false,
        error: `Máximo de ${campo.valor_maximo} caracteres`,
      };
    }
  }

  return { success: true };
}

/**
 * Valida todos os campos de um formulário
 */
export function validateForm(
  campos: Campo[],
  answers: Record<string, string>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  campos.forEach((campo) => {
    const campoId = campo.id.toString();
    const value = answers[campoId] || "";
    const result = validateField(campo, value);

    if (!result.success && result.error) {
      errors[campoId] = result.error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

