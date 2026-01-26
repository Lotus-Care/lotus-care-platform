"use client";

import { useState } from "react";
import type { Campo, Alerta } from "@/types/strapi";
import { validateField } from "@/lib/form-validation";
import { getMinValue, getMaxValue, parseOpcoes } from "@/lib/utils/fieldUtils";
import { getActiveAlerts, getAlertColor } from "@/lib/utils/alertUtils";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface FormFieldProps {
  campo: Campo;
  value: string;
  error?: string;
  onChange: (value: string, shouldScroll?: boolean) => void;
  onBlur?: () => void;
  inGrid?: boolean;
}

export default function FormField({
  campo,
  value,
  error,
  onChange,
  onBlur,
  inGrid = false,
}: FormFieldProps) {
  const campoId = campo.id.toString();
  const activeAlerts = getActiveAlerts(campo, value);
  const hasError = !!error;

  const handleChange = (newValue: string, shouldScroll = false) => {
    const maxValue = getMaxValue(campo);
    const minValue = getMinValue(campo);
    let finalValue = newValue;

    // Para campos de texto, limita comprimento em tempo real se houver máximo
    if (
      (campo.tipo === "texto" || campo.tipo === "texto_longo") &&
      maxValue != null &&
      typeof maxValue === "number" &&
      newValue.length > maxValue
    ) {
      finalValue = newValue.substring(0, maxValue);
    }

    // Para campos numéricos, ajusta automaticamente se passar do máximo
    if (campo.tipo === "numerico") {
      if (
        finalValue !== "" &&
        finalValue !== "-" &&
        finalValue !== "." &&
        finalValue !== "-."
      ) {
        const numValue = parseFloat(finalValue);
        if (!isNaN(numValue)) {
          // Se passou do máximo, ajusta para o máximo
          if (
            maxValue != null &&
            typeof maxValue === "number" &&
            numValue > maxValue
          ) {
            finalValue = maxValue.toString();
          }
        }
      }
    }

    onChange(finalValue, shouldScroll);
  };

  const handleCheckboxChange = (checkboxValue: string) => {
    const currentValue = value || "";
    const selectedValues = currentValue
      ? currentValue.split(",").filter((v) => v.trim() !== "")
      : [];
    const isChecked = selectedValues.includes(checkboxValue);

    let newValues: string[];
    if (isChecked) {
      newValues = selectedValues.filter((v) => v !== checkboxValue);
    } else {
      newValues = [...selectedValues, checkboxValue];
    }

    onChange(newValues.join(","));
  };

  const renderInput = () => {
    const baseInputClasses = `mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20"
        : "border-[var(--input)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
    }`;

    const minValue = getMinValue(campo);
    const maxValue = getMaxValue(campo);
    const hasMin = minValue != null && typeof minValue === "number";
    const hasMax = maxValue != null && typeof maxValue === "number";

    const helperText =
      hasMin || hasMax
        ? hasMin && hasMax && minValue != null && maxValue != null
          ? campo.tipo === "numerico"
            ? `Entre ${minValue} e ${maxValue}`
            : `${minValue}-${maxValue} caracteres`
          : hasMin && minValue != null
          ? campo.tipo === "numerico"
            ? `Mínimo: ${minValue}`
            : `Mínimo: ${minValue} caracteres`
          : hasMax && maxValue != null
          ? campo.tipo === "numerico"
            ? `Máximo: ${maxValue}`
            : `Máximo: ${maxValue} caracteres`
          : null
        : null;

    switch (campo.tipo) {
      case "numerico":
        return (
          <Input
            type="number"
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            min={minValue}
            max={maxValue}
            required={campo.obrigatorio}
            placeholder={campo.placeholder}
            error={error}
            helperText={helperText && !error ? helperText : undefined}
          />
        );

      case "texto":
        return (
          <Input
            type="text"
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            minLength={minValue}
            maxLength={maxValue}
            required={campo.obrigatorio}
            placeholder={campo.placeholder}
            error={error}
            helperText={helperText && !error ? helperText : undefined}
          />
        );

      case "texto_longo":
        return (
          <div className="space-y-1.5 sm:space-y-2">
            <textarea
              id={campoId}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={onBlur}
              minLength={minValue}
              maxLength={maxValue}
              required={campo.obrigatorio}
              placeholder={campo.placeholder}
              rows={4}
              className={`${baseInputClasses} resize-y`}
            />
            {helperText && !error && (
              <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                {helperText}
              </p>
            )}
            {error && (
              <div className="mt-1.5 rounded-lg border border-red-300 bg-red-50/80 dark:bg-red-950/20 dark:border-red-800/50 px-2.5 py-1.5">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <svg
                    className="h-3 w-3 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </div>
        );

      case "data":
        return (
          <Input
            type="date"
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            required={campo.obrigatorio}
            error={error}
          />
        );

      case "hora":
        return (
          <Input
            type="time"
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            required={campo.obrigatorio}
            error={error}
          />
        );

      case "data_hora":
        return (
          <Input
            type="datetime-local"
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            required={campo.obrigatorio}
            error={error}
          />
        );

      case "select":
        const selectOpcoes = parseOpcoes(campo.opcoes);

        // Se tiver até 2 opções, renderiza botões modernos
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
                      onClick={() => handleChange(opt.value, true)}
                      onBlur={onBlur}
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
              {error && (
                <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          );
        }

        // Se tiver mais de 2 opções, usa select tradicional
        return (
          <Select
            id={campoId}
            value={value}
            onChange={(e) => handleChange(e.target.value, true)}
            onBlur={onBlur}
            required={campo.obrigatorio}
            error={error}
          >
            <option value="">{campo.placeholder || "Selecione..."}</option>
            {selectOpcoes.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
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
                    onClick={() => handleChange(opt.value, true)}
                    onBlur={onBlur}
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
            {error && (
              <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );

      case "checkbox":
        const checkboxOpcoes = parseOpcoes(campo.opcoes);
        const selectedValues = value
          ? value.split(",").filter((v) => v.trim() !== "")
          : [];
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
                    onChange={() => handleCheckboxChange(opt.value)}
                    onBlur={onBlur}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--input)] rounded focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                  <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {opt.label}
                  </span>
                </label>
              );
            })}
            {error && (
              <p className="text-xs text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
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
                  handleChange(file.name);
                }
              }}
              onBlur={onBlur}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              required={campo.obrigatorio}
              className={`${baseInputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90 cursor-pointer`}
            />
            {value && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Arquivo selecionado: {value}
              </p>
            )}
            {error && (
              <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-1.5 sm:space-y-2 ${inGrid ? "" : ""}`}>
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
      {activeAlerts.length > 0 && (
        <div className="space-y-2 mt-3">
          {activeAlerts.map((alerta) => {
            const severityStyles = getAlertColor(alerta.Gravidade ?? 0);
            return (
              <div key={alerta.id} className="flex items-center gap-2 py-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${severityStyles.dot}`}
                />
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
}

