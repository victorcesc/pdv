/**
 * Persistir payload do app no Postgres; montar payload para restauração.
 * Será implementado no passo de sync.
 */
export async function pushSync(_payload: unknown): Promise<{ ok: boolean }> {
  return { ok: false };
}
export async function getSyncPayload(_filters: unknown): Promise<unknown> {
  return {};
}
