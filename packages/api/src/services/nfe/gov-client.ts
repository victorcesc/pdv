/**
 * Abstração da API Gov (SEFAZ ou provedor).
 * Será implementado no passo de integração real.
 */
export const govClient = {
  async emitir(_dados: unknown): Promise<unknown> {
    return { ok: false, message: "mock" };
  },
  async consultar(_chave: string): Promise<unknown> {
    return null;
  },
  async cancelar(_chave: string, _justificativa: string): Promise<unknown> {
    return null;
  },
};
