/**
 * Função para fazer scroll até um campo específico
 */
export function scrollToField(fieldId: string) {
  const element = document.getElementById(fieldId);
  if (element) {
    setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Foca no próximo campo se for um input
      const input = element.querySelector(
        "input, select, textarea"
      ) as HTMLElement;
      if (input && typeof input.focus === "function") {
        setTimeout(() => {
          input.focus();
        }, 300);
      }
    }, 100);
  }
}

/**
 * Hook para fazer scroll até o próximo campo
 */
export function useScrollToField() {
  const scrollToNextField = (currentCampoId: string, allCampos: Array<{ id: number | string }>) => {
    let foundCurrent = false;
    let nextCampo: { id: number | string } | null = null;

    // Itera pelos campos para encontrar o próximo
    for (let i = 0; i < allCampos.length; i++) {
      const campo = allCampos[i];
      const campoId = campo.id.toString();

      if (foundCurrent) {
        nextCampo = campo;
        break;
      }

      if (campoId === currentCampoId) {
        foundCurrent = true;
      }
    }

    // Se encontrou o próximo campo, faz scroll até ele
    if (nextCampo) {
      scrollToField(nextCampo.id.toString());
    }
  };

  return { scrollToNextField };
}

