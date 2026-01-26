"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  saveFormSubmission,
  createPatient,
  getPatients,
} from "@/app/actions";
import { validateField, validateForm } from "@/lib/form-validation";
import type { FormAnswer } from "@/types/form";
import type { Form, Campo, Alerta } from "@/types/strapi";
import type { Patient } from "@/types/patient";

interface FormsClientProps {
  initialForm: Form | null;
  initialPatients: Patient[];
  strapiError?: { status: number; message: string };
  userName: string;
}

export default function FormsClient({
  initialForm,
  initialPatients,
  strapiError,
  userName,
}: FormsClientProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = initialForm;

  // Calcula progresso do formulário
  const totalFields = form
    ? form.secoes.reduce((acc, secao) => acc + secao.campos.length, 0)
    : 0;
  const filledFields = Object.keys(answers).filter(
    (key) => answers[key] && answers[key].trim() !== ""
  ).length;
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

  useEffect(() => {
    if (!form) return;
    // Se não há paciente selecionado e há pacientes disponíveis, seleciona o primeiro
    if (!selectedPatientId && patients.length > 0) {
      setTimeout(() => {
        setSelectedPatientId(patients[0].id);
      }, 0);
    }
  }, [form, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preenche automaticamente campos de data e hora com a data/hora atual
  useEffect(() => {
    if (!form) return;

    const now = new Date();
    
    // Formata data no formato YYYY-MM-DD
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Formata hora no formato HH:MM
    const formatTime = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    // Formata data e hora no formato YYYY-MM-DDTHH:MM
    const formatDateTime = (date: Date): string => {
      const dateStr = formatDate(date);
      const timeStr = formatTime(date);
      return `${dateStr}T${timeStr}`;
    };

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoId = campo.id.toString();
        
        // Só preenche se o campo ainda não tem valor
        setAnswers((prev) => {
          // Se já tem valor, não altera
          if (prev[campoId]) return prev;

          let valueToSet: string | undefined;
          
          if (campo.tipo === "data") {
            valueToSet = formatDate(now);
          } else if (campo.tipo === "hora") {
            valueToSet = formatTime(now);
          } else if (campo.tipo === "data_hora") {
            valueToSet = formatDateTime(now);
          }

          if (valueToSet) {
            return {
              ...prev,
              [campoId]: valueToSet,
            };
          }
          
          return prev;
        });
      });
    });
  }, [form]);

  // Preenche automaticamente campos relacionados a "cuidador" com o nome do usuário
  useEffect(() => {
    if (!form || !userName) return;

    const caregiverKeywords = [
      "cuidador",
      "cuidadora",
      "responsável",
      "responsavel",
      "nome do cuidador",
      "nome da cuidadora",
      "nome do responsável",
      "nome da responsável",
    ];

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoTitle = campo.titulo.toLowerCase().trim();
        const isCaregiverField = caregiverKeywords.some((keyword) =>
          campoTitle.includes(keyword)
        );

        if (isCaregiverField && campo.tipo === "texto" && !answers[campo.id.toString()]) {
          setAnswers((prev) => ({
            ...prev,
            [campo.id.toString()]: userName,
          }));
        }
      });
    });
  }, [form, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper para obter valor mínimo/máximo
  // Retorna undefined se o valor for null (sem limitação)
  const getMinValue = (campo: Campo): number | undefined => {
    return campo.valor_minimo != null ? campo.valor_minimo : undefined;
  };

  const getMaxValue = (campo: Campo): number | undefined => {
    return campo.valor_maximo != null ? campo.valor_maximo : undefined;
  };

  // Valida um valor de campo usando a função de validação
  const validateFieldValue = (campo: Campo, value: string): string | null => {
    const result = validateField(campo, value);
    return result.success ? null : result.error || null;
  };

  // Encontra o próximo campo após o campo atual e faz scroll até ele
  const scrollToNextField = (currentCampoId: string) => {
    if (!form) return;

    let foundCurrent = false;
    let nextCampo: Campo | null = null;

    // Itera pelas seções e campos para encontrar o próximo
    for (const secao of form.secoes) {
      for (let i = 0; i < secao.campos.length; i++) {
        const campo = secao.campos[i];
        const campoId = campo.id.toString();

        if (foundCurrent) {
          nextCampo = campo;
          break;
        }

        if (campoId === currentCampoId) {
          foundCurrent = true;
        }
      }

      if (nextCampo) break;
    }

    // Se encontrou o próximo campo, faz scroll até ele
    if (nextCampo) {
      const nextCampoId = nextCampo.id.toString();
      const nextElement = document.getElementById(nextCampoId);
      
      if (nextElement) {
        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          nextElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          
          // Foca no próximo campo se for um input
          const input = nextElement.querySelector("input, select, textarea") as HTMLElement;
          if (input && typeof input.focus === "function") {
            setTimeout(() => {
              input.focus();
            }, 300);
          }
        }, 100);
      }
    }
  };

  const handleAnswerChange = (campoId: string, value: string, campo: Campo, isCheckbox: boolean = false, checkboxValue?: string, shouldScroll: boolean = false) => {
    const maxValue = getMaxValue(campo);
    const minValue = getMinValue(campo);
    
    // Para checkbox, gerencia array de valores
    if (campo.tipo === "checkbox" && isCheckbox && checkboxValue) {
      const currentValue = answers[campoId] || "";
      const selectedValues = currentValue ? currentValue.split(",").filter(v => v.trim() !== "") : [];
      const isChecked = selectedValues.includes(checkboxValue);
      
      let newValues: string[];
      if (isChecked) {
        // Remove o valor
        newValues = selectedValues.filter(v => v !== checkboxValue);
      } else {
        // Adiciona o valor
        newValues = [...selectedValues, checkboxValue];
      }
      
      setAnswers((prev) => ({
        ...prev,
        [campoId]: newValues.join(","),
      }));
      
      return;
    }
    
    let finalValue = value;
    
    // Para campos de texto, limita comprimento em tempo real se houver máximo
    if ((campo.tipo === "texto" || campo.tipo === "texto_longo") && maxValue != null && typeof maxValue === "number" && value.length > maxValue) {
      finalValue = value.substring(0, maxValue);
    }
    
    // Para campos numéricos, ajusta automaticamente se passar do máximo
    if (campo.tipo === "numerico") {
      if (finalValue !== "" && finalValue !== "-" && finalValue !== "." && finalValue !== "-.") {
        const numValue = parseFloat(finalValue);
        if (!isNaN(numValue)) {
          // Se passou do máximo, ajusta para o máximo
          if (maxValue != null && typeof maxValue === "number" && numValue > maxValue) {
            finalValue = maxValue.toString();
          }
          // Se passou do mínimo, ajusta para o mínimo (apenas se já tiver um valor válido)
          else if (minValue != null && typeof minValue === "number" && numValue < minValue && finalValue.length > 0) {
            // Não ajusta durante a digitação se ainda está digitando um número menor
            // Isso permite digitar valores negativos ou decimais
          }
        } else {
          // Mantém erro de formato inválido
          setFieldErrors((prev) => ({
            ...prev,
            [campoId]: "Por favor, insira um número válido",
          }));
          return;
        }
      }
    }

    // Verifica se o valor realmente mudou antes de atualizar
    const currentValue = answers[campoId];
    const valueChanged = currentValue !== finalValue;

    // Atualiza o valor
    setAnswers((prev) => ({
      ...prev,
      [campoId]: finalValue,
    }));

    // Limpa erros durante a digitação (validação completa será no blur)
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      // Remove apenas erros de min/max, mantém outros erros se necessário
      if (newErrors[campoId]?.includes("mínimo") || newErrors[campoId]?.includes("máximo")) {
        delete newErrors[campoId];
      }
      return newErrors;
    });

    // Se for radio ou select, shouldScroll for true e o valor mudou, faz scroll para o próximo campo
    if (shouldScroll && valueChanged && (campo.tipo === "radio" || campo.tipo === "select")) {
      scrollToNextField(campoId);
    }
  };

  const handleFieldBlur = (campoId: string, campo: Campo) => {
    const value = answers[campoId] || "";
    // Validação completa no blur, incluindo min/max
    const validationError = validateFieldValue(campo, value);
    
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (validationError) {
        newErrors[campoId] = validationError;
      } else {
        delete newErrors[campoId];
      }
      return newErrors;
    });
  };

  const handleCreatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const gender = formData.get("gender") as string;
    const birthDate = formData.get("birthDate") as string;
    const followUpEmail = formData.get("followUpEmail") as string;

    // Validação básica
    if (!name || name.trim() === "") {
      setError("Nome é obrigatório");
      return;
    }

    startTransition(async () => {
      try {
        const newPatient = await createPatient({
          name: name.trim(),
          gender: gender || "",
          birthDate: birthDate || "",
          followUpEmail: followUpEmail || "",
        });

        // Busca a lista atualizada de pacientes
        const updatedPatients = await getPatients();
        
        // Atualiza a lista de pacientes
        setPatients(updatedPatients);
        
        // Fecha o formulário de criação primeiro
        setShowNewPatientForm(false);
        
        // Aguarda um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          // Seleciona o paciente recém-criado
          setSelectedPatientId(newPatient.id);
        }, 100);
        
        // Limpa qualquer erro anterior
        setError(null);
      } catch (err) {
        console.error("Erro ao criar paciente:", err);
        setError(err instanceof Error ? err.message : "Erro ao criar paciente. Tente novamente.");
      }
    });
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form) return;
    if (!selectedPatientId) {
      setError("Por favor, selecione ou crie um paciente");
      return;
    }

    // Valida todos os campos antes de submeter usando a função de validação
    const allCampos: Campo[] = [];
    form.secoes.forEach((secao) => {
      allCampos.push(...secao.campos);
    });

    const validationResult = validateForm(allCampos, answers);

    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors);
      setError("Por favor, corrija os erros nos campos antes de salvar");
      
      // Scroll para o primeiro erro
      const firstErrorFieldId = Object.keys(validationResult.errors)[0];
      if (firstErrorFieldId) {
        // Pequeno delay para garantir que o estado foi atualizado e os erros estão visíveis
        setTimeout(() => {
          const firstErrorField = document.getElementById(firstErrorFieldId);
          if (firstErrorField) {
            // Faz scroll suave até o campo com erro
            firstErrorField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            
            // Tenta focar no input dentro do campo
            const input = firstErrorField.querySelector("input, select, textarea") as HTMLElement;
            if (input && typeof input.focus === "function") {
              setTimeout(() => {
                input.focus();
                // Se for um campo de texto ou numérico, seleciona o conteúdo para facilitar correção
                if (input instanceof HTMLInputElement && (input.type === "text" || input.type === "number")) {
                  input.select();
                }
              }, 300);
            } else {
              // Se não encontrar input, foca no próprio elemento
              setTimeout(() => {
                if (firstErrorField instanceof HTMLElement && typeof firstErrorField.focus === "function") {
                  firstErrorField.focus();
                }
              }, 300);
            }
          }
        }, 100);
      }
      return;
    }

    const formAnswers: FormAnswer[] = [];

    form.secoes.forEach((secao) => {
      secao.campos.forEach((campo) => {
        const campoId = campo.id.toString();
        const answer = answers[campoId];

        if (answer !== undefined && answer !== "") {
          // Mapeia o tipo do campo para o questionType
          let questionType: "number" | "slider" | "text" = "text";
          if (campo.tipo === "numerico") {
            questionType = "number";
          } else if (campo.tipo === "texto" || campo.tipo === "texto_longo" || campo.tipo === "data" || campo.tipo === "hora" || campo.tipo === "data_hora" || campo.tipo === "select" || campo.tipo === "radio" || campo.tipo === "checkbox" || campo.tipo === "midia") {
            questionType = "text";
          }

          formAnswers.push({
            questionId: campoId,
            questionText: campo.titulo,
            questionType,
            answer, // Para checkbox, já vem como string separada por vírgulas
          });
        }
      });
    });

    startTransition(async () => {
      try {
        await saveFormSubmission({
          formId: form.id.toString(),
          formTitle: form.titulo,
          patientId: selectedPatientId,
          answers: formAnswers,
        });

        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar formulário");
      }
    });
  };

  const getActiveAlerts = (campo: Campo, value: string): Alerta[] => {
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
  };

  // Calcula a cor do alerta baseada na gravidade (0-100)
  // 0 = amarelo puro, 100 = vermelho puro
  // Interpola suavemente entre amarelo e vermelho
  const getAlertColor = (gravidade: number) => {
    // Normaliza a gravidade para 0-100
    const normalizedGravidade = Math.max(0, Math.min(100, gravidade ?? 0));
    
    // Interpola entre amarelo (0) e vermelho (100)
    // Progressão: amarelo -> amarelo-escuro -> laranja -> vermelho
    if (normalizedGravidade <= 20) {
      // 0-20: Amarelo claro
      return {
        dot: "bg-yellow-400",
        text: "text-yellow-700 dark:text-yellow-400",
      };
    } else if (normalizedGravidade <= 40) {
      // 21-40: Amarelo médio
      return {
        dot: "bg-yellow-500",
        text: "text-yellow-700 dark:text-yellow-400",
      };
    } else if (normalizedGravidade <= 60) {
      // 41-60: Amarelo-alaranjado
      return {
        dot: "bg-amber-500",
        text: "text-amber-700 dark:text-amber-400",
      };
    } else if (normalizedGravidade <= 80) {
      // 61-80: Laranja
      return {
        dot: "bg-orange-500",
        text: "text-orange-700 dark:text-orange-400",
      };
    } else {
      // 81-100: Vermelho
      return {
        dot: "bg-red-500",
        text: "text-red-700 dark:text-red-400",
      };
    }
  };

  // Parseia as opções do campo (pode vir como JSON string ou array)
  const parseOpcoes = (opcoes?: string | string[] | { label: string; value: string }[]): { label: string; value: string }[] => {
    if (!opcoes) return [];
    
    // Se já é um array de objetos
    if (Array.isArray(opcoes)) {
      // Se é array de strings, converte para objetos
      if (opcoes.length > 0 && typeof opcoes[0] === "string") {
        return (opcoes as string[]).map((opt) => ({ label: opt, value: opt }));
      }
      // Se já é array de objetos, valida e retorna
      if (opcoes.length > 0 && typeof opcoes[0] === "object" && opcoes[0] !== null && "label" in opcoes[0] && "value" in opcoes[0]) {
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
          if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null && "label" in parsed[0] && "value" in parsed[0]) {
            return parsed as { label: string; value: string }[];
          }
        }
      } catch {
        // Se não conseguir parsear, trata como string única
        return [{ label: opcoes, value: opcoes }];
      }
    }
    
    return [];
  };

  // Verifica se um campo é "pequeno" e pode ser colocado em grid
  const isSmallField = (campo: Campo): boolean => {
    // Campos que sempre ocupam linha inteira
    if (campo.tipo === "texto_longo" || campo.tipo === "midia" || campo.tipo === "checkbox" || campo.tipo === "radio") return false;
    
    // Campos com descrição muito longa ocupam linha inteira
    if (campo.descricao && campo.descricao.length > 80) return false;
    
    // Campos numéricos, texto, data, hora, select são pequenos
    return campo.tipo === "numerico" || campo.tipo === "texto" || campo.tipo === "data" || campo.tipo === "hora" || campo.tipo === "select";
  };

  const renderCampo = (campo: Campo, inGrid: boolean = false) => {
    const campoId = campo.id.toString();
    const value = answers[campoId] || "";
    const activeAlerts = getActiveAlerts(campo, value);
    const fieldError = fieldErrors[campoId];
    const hasError = !!fieldError;

    const renderInput = () => {
      const baseInputClasses = `mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:outline-none focus:ring-2 ${
        hasError
          ? "border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20"
          : "border-[var(--input)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
      }`;

      switch (campo.tipo) {
        case "numerico":
          return (
            <div>
              <input
                type="number"
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                min={getMinValue(campo)}
                max={getMaxValue(campo)}
                required={campo.obrigatorio}
                placeholder={campo.placeholder}
                className={baseInputClasses}
              />
              {(() => {
                const minValue = getMinValue(campo);
                const maxValue = getMaxValue(campo);
                const hasMin = minValue != null && typeof minValue === "number";
                const hasMax = maxValue != null && typeof maxValue === "number";
                
                if ((hasMin || hasMax) && !hasError) {
                  return (
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                      {hasMin && hasMax && minValue != null && maxValue != null
                        ? `Entre ${minValue} e ${maxValue}`
                        : hasMin && minValue != null
                        ? `Mínimo: ${minValue}`
                        : hasMax && maxValue != null
                        ? `Máximo: ${maxValue}`
                        : null}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          );

        case "texto":
          return (
            <div>
              <input
                type="text"
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                minLength={getMinValue(campo)}
                maxLength={getMaxValue(campo)}
                required={campo.obrigatorio}
                placeholder={campo.placeholder}
                className={baseInputClasses}
              />
              {(() => {
                const minValue = getMinValue(campo);
                const maxValue = getMaxValue(campo);
                const hasMin = minValue != null && typeof minValue === "number";
                const hasMax = maxValue != null && typeof maxValue === "number";
                
                if ((hasMin || hasMax) && !hasError) {
                  return (
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                      {hasMin && hasMax && minValue != null && maxValue != null
                        ? `${minValue}-${maxValue} caracteres`
                        : hasMin && minValue != null
                        ? `Mínimo: ${minValue} caracteres`
                        : hasMax && maxValue != null
                        ? `Máximo: ${maxValue} caracteres`
                        : null}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          );

        case "texto_longo":
          return (
            <div>
              <textarea
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                minLength={getMinValue(campo)}
                maxLength={getMaxValue(campo)}
                required={campo.obrigatorio}
                placeholder={campo.placeholder}
                rows={4}
                className={baseInputClasses + " resize-y"}
              />
              {(() => {
                const minValue = getMinValue(campo);
                const maxValue = getMaxValue(campo);
                const hasMin = minValue != null && typeof minValue === "number";
                const hasMax = maxValue != null && typeof maxValue === "number";
                
                if ((hasMin || hasMax) && !hasError) {
                  return (
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                      {hasMin && hasMax && minValue != null && maxValue != null
                        ? `${minValue}-${maxValue} caracteres`
                        : hasMin && minValue != null
                        ? `Mínimo: ${minValue} caracteres`
                        : hasMax && maxValue != null
                        ? `Máximo: ${maxValue} caracteres`
                        : null}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          );

        case "data":
          return (
            <div>
              <input
                type="date"
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                required={campo.obrigatorio}
                className={baseInputClasses}
              />
            </div>
          );

        case "hora":
          return (
            <div>
              <input
                type="time"
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                required={campo.obrigatorio}
                className={baseInputClasses}
              />
            </div>
          );

        case "data_hora":
          return (
            <div>
              <input
                type="datetime-local"
                id={campoId}
                value={value}
                onChange={(e) => handleAnswerChange(campoId, e.target.value, campo)}
                onBlur={() => handleFieldBlur(campoId, campo)}
                required={campo.obrigatorio}
                className={baseInputClasses}
              />
            </div>
          );

        case "select":
          const selectOpcoes = parseOpcoes(campo.opcoes);
          
          // Se tiver até 2 opções, renderiza botões modernos ao invés de select
          if (selectOpcoes.length <= 2) {
            return (
              <div className="mt-1.5 sm:mt-2">
                <div className="flex gap-2 sm:gap-3">
                  {selectOpcoes.map((opt, idx) => {
                    const isSelected = value === opt.value;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswerChange(campoId, opt.value, campo, false, undefined, true)}
                        onBlur={() => handleFieldBlur(campoId, campo)}
                        className={`flex-1 rounded-lg sm:rounded-xl border-2 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium transition-all touch-manipulation ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)] active:scale-[0.98]"
                        } ${hasError ? "border-red-400 dark:border-red-600" : ""}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          // Se tiver mais de 2 opções, usa select tradicional
          return (
            <div>
              <select
                id={campoId}
                value={value}
                onChange={(e) => {
                  handleAnswerChange(campoId, e.target.value, campo, false, undefined, true);
                }}
                onBlur={() => handleFieldBlur(campoId, campo)}
                required={campo.obrigatorio}
                className={baseInputClasses}
              >
                <option value="">{campo.placeholder || "Selecione..."}</option>
                {selectOpcoes.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );

        case "radio":
          const radioOpcoes = parseOpcoes(campo.opcoes);
          return (
            <div className="mt-1.5 sm:mt-2">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {radioOpcoes.map((opt, idx) => {
                  const isSelected = value === opt.value;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerChange(campoId, opt.value, campo, false, undefined, true)}
                      onBlur={() => handleFieldBlur(campoId, campo)}
                      className={`rounded-lg sm:rounded-xl border-2 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium transition-all touch-manipulation ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                          : "border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)] active:scale-[0.98]"
                      } ${hasError ? "border-red-400 dark:border-red-600" : ""}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );

        case "checkbox":
          const checkboxOpcoes = parseOpcoes(campo.opcoes);
          const selectedValues = value ? value.split(",").filter(v => v.trim() !== "") : [];
          return (
            <div className="space-y-2 mt-1.5 sm:mt-2">
              {checkboxOpcoes.map((opt, idx) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAnswerChange(campoId, "", campo, true, opt.value)}
                      onBlur={() => handleFieldBlur(campoId, campo)}
                      className="w-4 h-4 text-[var(--primary)] border-[var(--input)] rounded focus:ring-[var(--primary)]/20 cursor-pointer"
                    />
                    <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          );

        case "midia":
          return (
            <div>
              <input
                type="file"
                id={campoId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Para upload de arquivo, podemos salvar o nome ou fazer upload
                    // Por enquanto, salvamos o nome do arquivo
                    handleAnswerChange(campoId, file.name, campo);
                  }
                }}
                onBlur={() => handleFieldBlur(campoId, campo)}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                required={campo.obrigatorio}
                className={baseInputClasses + " file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90 cursor-pointer"}
              />
              {value && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Arquivo selecionado: {value}
                </p>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div key={campo.id} className={`space-y-1.5 sm:space-y-2 ${inGrid ? "" : ""}`}>
        <label
          htmlFor={campoId}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[var(--foreground)]"
        >
          {campo.titulo}
          {campo.obrigatorio && (
            <span className="text-red-500 text-[10px] sm:text-xs">*</span>
          )}
        </label>
        {campo.descricao && (
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] leading-relaxed">
            {campo.descricao}
          </p>
        )}
        {renderInput()}
        {hasError && (
          <div className="mt-1.5 rounded-lg border border-red-300 bg-red-50/80 dark:bg-red-950/20 dark:border-red-800/50 px-2.5 py-1.5">
            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fieldError}
            </p>
          </div>
        )}
        {activeAlerts.length > 0 && (
          <div className="space-y-2 mt-3">
            {activeAlerts.map((alerta) => {
              // Usa a gravidade (0-100) para determinar a cor
              // 0 = amarelo, 100 = vermelho
              const severityStyles = getAlertColor(alerta.Gravidade ?? 0); // Default 50 se não houver gravidade

              return (
                <div
                  key={alerta.id}
                  className="flex items-center gap-2 py-1.5"
                >
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${severityStyles.dot}`} />
                  <p className={`text-xs sm:text-sm ${severityStyles.text}`}>
                    {alerta.Mensagem}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Agrupa campos consecutivos pequenos para renderização em grid
  const groupFieldsForGrid = (campos: Campo[]) => {
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
  };

  if (!form) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {strapiError ? (
            <div className="rounded-xl border border-red-500/50 bg-red-50 px-6 py-8 text-center dark:bg-red-900/20 dark:text-red-400">
              <p className="text-red-700 dark:text-red-300">
                Erro ao carregar formulário: {strapiError.message}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
                Nenhum formulário disponível
              </h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Não há formulários publicados no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8 pb-24 sm:pb-8">
      <div className="mx-auto max-w-5xl">
        {/* Header com Progresso */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {form.titulo}
              </h1>
              {form.descricao && (
                <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-[var(--muted-foreground)]">
                  {form.descricao}
                </p>
              )}
            </div>
            {form.versao && (
              <div className="self-start rounded-lg bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                v{form.versao}
              </div>
            )}
          </div>

          {/* Barra de Progresso */}
       
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-6" id="main-form">
          {/* Seleção de Paciente - Card Visual */}
          <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--primary)]/10">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
                Paciente
              </h2>
            </div>

            {!showNewPatientForm ? (
              <div className="space-y-3">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full rounded-lg sm:rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="">Selecione um paciente...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 active:scale-95"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Novo Paciente
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3 sm:p-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreatePatient(e);
                  }} 
                  className="space-y-3 sm:space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full rounded-lg sm:rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                        Sexo
                      </label>
                      <select
                        name="gender"
                        className="w-full rounded-lg sm:rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="Other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        name="birthDate"
                        className="w-full rounded-lg sm:rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      Email de Acompanhamento
                    </label>
                    <input
                      type="email"
                      name="followUpEmail"
                      className="w-full rounded-lg sm:rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 rounded-lg sm:rounded-xl bg-[var(--primary)] px-4 py-2.5 sm:py-3 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-50 active:scale-95 touch-manipulation"
                    >
                      {isPending ? "Criando..." : "Criar Paciente"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewPatientForm(false);
                        setError(null);
                      }}
                      className="rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 sm:py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted)] active:scale-95 touch-manipulation"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Seções do Formulário */}
          <div className="space-y-4 sm:space-y-6">
            {form.secoes.map((secao, index) => (
              <div
                key={secao.id}
                className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--primary)]/10 text-base sm:text-lg font-bold text-[var(--primary)]">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
                      {secao.titulo}
                    </h3>
                    {secao.descricao && (
                      <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[var(--muted-foreground)]">
                        {secao.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-6 pl-0 sm:pl-14">
                  {groupFieldsForGrid(secao.campos).map((group, groupIndex) => {
                    if (group.type === "grid") {
                      return (
                        <div
                          key={`grid-${groupIndex}`}
                          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                          {group.fields.map((campo) => renderCampo(campo, true))}
                        </div>
                      );
                    } else {
                      return (
                        <div key={`single-${groupIndex}`} className="space-y-4 sm:space-y-6">
                          {group.fields.map((campo) => renderCampo(campo, false))}
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Botão de Submit */}
          <div className="sticky bottom-0 left-0 right-0 z-10 rounded-t-xl sm:rounded-2xl border-t sm:border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-lg -mx-3 sm:mx-0">
            
          <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-[var(--foreground)]">
                Progresso
              </span>
              <span className="text-[var(--muted-foreground)]">
                {filledFields}/{totalFields}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !selectedPatientId}
              className="mt-2 w-full rounded-lg sm:rounded-xl bg-[var(--primary)] px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                "Salvar Formulário"
              )}
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
}
