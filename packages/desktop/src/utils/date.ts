/**
 * Utilitários para formatação e conversão de datas
 */

/**
 * Converte uma data UTC para o fuso horário local (Brasil)
 * @param date - Data em UTC (string ISO ou Date)
 * @returns Date no fuso horário local
 */
export function convertUTCToLocal(date: string | Date): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj;
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data (string ISO, Date ou null/undefined)
 * @param includeTime - Se deve incluir hora (padrão: true)
 * @returns String formatada ou string vazia se date for null/undefined
 */
export function formatDateBR(
  date: string | Date | null | undefined,
  includeTime: boolean = true
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };

  return new Intl.DateTimeFormat("pt-BR", options).format(dateObj);
}

/**
 * Formata uma data para exibição completa (data + hora)
 * @param date - Data (string ISO, Date ou null/undefined)
 * @returns String formatada no formato "DD/MM/YYYY HH:mm:ss"
 */
export function formatDateTimeBR(date: string | Date | null | undefined): string {
  return formatDateBR(date, true);
}

/**
 * Formata uma data apenas (sem hora)
 * @param date - Data (string ISO, Date ou null/undefined)
 * @returns String formatada no formato "DD/MM/YYYY"
 */
export function formatDateOnlyBR(date: string | Date | null | undefined): string {
  return formatDateBR(date, false);
}

/**
 * Formata uma data relativa (ex: "há 2 horas", "ontem", etc)
 * @param date - Data (string ISO, Date ou null/undefined)
 * @returns String formatada relativa ou data formatada se for muito antiga
 */
export function formatRelativeDateBR(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "agora";
  } else if (diffMinutes < 60) {
    return `há ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
  } else if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  } else if (diffDays === 1) {
    return "ontem";
  } else if (diffDays < 7) {
    return `há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } else {
    return formatDateOnlyBR(dateObj);
  }
}

