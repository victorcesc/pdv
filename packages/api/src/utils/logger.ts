/**
 * Utilitário para logs com timestamp
 */

function getTimestamp(): string {
  return new Date().toISOString();
}

export function log(message: string, ...args: unknown[]): void {
  console.log(`[${getTimestamp()}] ${message}`, ...args);
}

export function logError(message: string, ...args: unknown[]): void {
  console.error(`[${getTimestamp()}] ${message}`, ...args);
}

export function logWarn(message: string, ...args: unknown[]): void {
  console.warn(`[${getTimestamp()}] ${message}`, ...args);
}

