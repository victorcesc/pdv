import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";

export const authRouter = Router();

/**
 * POST /auth/generate-registration-key
 * Gera um UUID único para ser usado como chave de registro
 * Este UUID será enviado para o usuário que assinou para que ele possa se cadastrar na plataforma
 */
authRouter.post("/generate-registration-key", async (_req: Request, res: Response) => {
  try {
    const registrationKey = randomUUID();
    
    // TODO: Quando Prisma estiver configurado, salvar o registrationKey no banco
    // associado ao usuário/assinatura que solicitou
    
    res.status(200).json({
      success: true,
      registrationKey,
      message: "Chave de registro gerada com sucesso",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao gerar chave de registro",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

