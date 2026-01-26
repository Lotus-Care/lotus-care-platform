import type { Alerta } from "@/types/strapi";

/**
 * Retorna os alertas ativos para um campo baseado no valor
 */
export function getActiveAlerts(campo: { alertas?: Alerta[] }, value: string): Alerta[] {
  if (!campo.alertas || campo.alertas.length === 0) return [];
  if (!value || value.trim() === "") return [];

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return [];

  // Filtra alertas ativos baseado na condição
  const activeAlerts = campo.alertas.filter((alerta) => {
    switch (alerta.avisar_quando) {
      case "Valor for Acima":
        return numValue > alerta.Valor;
      case "Valor for Abaixo":
        return numValue < alerta.Valor;
      case "Valor for Igual":
        return numValue === alerta.Valor;
      case "Valor for Igual ou Acima":
        return numValue >= alerta.Valor;
      case "Valor for Igual ou Abaixo ":
        return numValue <= alerta.Valor;
      default:
        return false;
    }
  });

  if (activeAlerts.length === 0) return [];

  // Agrupa alertas por tipo (avisar_quando) e pega apenas o de maior gravidade de cada grupo
  const alertsByType = new Map<string, Alerta>();

  activeAlerts.forEach((alerta) => {
    const tipo = alerta.avisar_quando;
    const gravidadeAtual = alerta.Gravidade ?? 0;

    const alertaExistente = alertsByType.get(tipo);
    const gravidadeExistente = alertaExistente?.Gravidade ?? 0;

    // Se não há alerta deste tipo ou se a gravidade atual é maior, substitui
    if (!alertaExistente || gravidadeAtual > gravidadeExistente) {
      alertsByType.set(tipo, alerta);
    }
  });

  // Retorna apenas os alertas de maior gravidade de cada tipo
  return Array.from(alertsByType.values());
}

/**
 * Calcula a cor do alerta baseada na gravidade (0-100)
 */
export function getAlertColor(gravidade: number) {
  // Normaliza a gravidade para 0-100
  const normalizedGravidade = Math.max(0, Math.min(100, gravidade ?? 0));

  // Interpola entre amarelo (0) e vermelho (100)
  if (normalizedGravidade <= 20) {
    return {
      dot: "bg-yellow-400",
      text: "text-yellow-700 dark:text-yellow-400",
    };
  } else if (normalizedGravidade <= 40) {
    return {
      dot: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-400",
    };
  } else if (normalizedGravidade <= 60) {
    return {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    };
  } else if (normalizedGravidade <= 80) {
    return {
      dot: "bg-orange-500",
      text: "text-orange-700 dark:text-orange-400",
    };
  } else {
    return {
      dot: "bg-red-500",
      text: "text-red-700 dark:text-red-400",
    };
  }
}

