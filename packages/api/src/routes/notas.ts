import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user.js";
import { AppError } from "../middleware/error.js";

export const notasRouter = Router();

// Placeholder: rotas de notas serão implementadas no passo de Config e DB + serviço NF-e
notasRouter.get("/", (_req, res) => {
  res.json({ message: "Notas routes – em implementação", data: [] });
});

/**
 * POST /invoices/process
 * Processa uma nota fiscal pendente (gerada offline)
 * Requer autenticação (Bearer token)
 * 
 * Esta rota recebe uma nota fiscal com status "pending" e tenta gerá-la na SEFAZ.
 * Por enquanto, é um placeholder que simula o processamento.
 * TODO: Integrar com serviço real de emissão de NF-e
 */
notasRouter.post("/process", userMiddleware, async (req: Request, res: Response) => {
  console.log("[INVOICES] POST /invoices/process - Requisição recebida");
  console.log("[INVOICES] User ID:", req.userId);

  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
        code: "UNAUTHENTICATED",
      });
    }

    const { sale_id, sale, provisional_number } = req.body;

    if (!sale_id || !sale) {
      return res.status(400).json({
        success: false,
        message: "Dados da venda são obrigatórios",
        code: "VALIDATION_ERROR",
      });
    }

    console.log(`[INVOICES] Processando nota fiscal para venda ${sale_id} (provisional: ${provisional_number || "N/A"})`);

    // TODO: Aqui será feita a integração real com SEFAZ
    // Por enquanto, simulamos o processamento retornando dados fictícios
    
    // Simular processamento (em produção, aqui seria a chamada à SEFAZ)
    const invoice_number = `NF${Date.now()}`;
    const access_key = `NFe${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
    
    console.log(`[INVOICES] ✅ Nota fiscal processada: ${invoice_number} | Chave: ${access_key}`);

    res.status(200).json({
      success: true,
      invoice_number,
      access_key,
      xml_content: null, // TODO: Gerar XML real
      status: "issued",
      message: "Nota fiscal processada com sucesso",
    });
  } catch (error) {
    console.error("[INVOICES] ❌ Erro ao processar nota fiscal:", error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao processar nota fiscal",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});
