import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

export type Locale = "pt-BR" | "en";

export type TranslationKey = keyof typeof ptBR;

const translations: Record<Locale, typeof ptBR> = {
  "pt-BR": ptBR,
  "en": en,
};

// Get locale from localStorage or default to pt-BR
export const getLocale = (): Locale => {
  const stored = localStorage.getItem("locale") as Locale;
  return stored && (stored === "pt-BR" || stored === "en") ? stored : "pt-BR";
};

// Set locale
export const setLocale = (locale: Locale): void => {
  localStorage.setItem("locale", locale);
};

// Get translation function
export const t = (key: string, locale?: Locale): string => {
  const currentLocale = locale || getLocale();
  const keys = key.split(".");
  let value: any = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // If translation not found, return the key
      return key;
    }
  }

  return typeof value === "string" ? value : key;
};

// Export default locale
export const defaultLocale: Locale = "pt-BR";

// Format date based on locale
export const formatDate = (date: Date | string, locale?: Locale): string => {
  const currentLocale = locale || getLocale();
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (currentLocale === "pt-BR") {
    // DD/MM/YYYY format for Portuguese
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    // MM/DD/YYYY format for English
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;
  }
};

// Format date and time based on locale
export const formatDateTime = (date: Date | string, locale?: Locale): string => {
  const currentLocale = locale || getLocale();
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const dateStr = formatDate(dateObj, currentLocale);
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  
  return `${dateStr} ${hours}:${minutes}`;
};

