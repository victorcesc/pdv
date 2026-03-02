import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user.js";
import { GetInitialDataUseCase } from "../use-cases/sync/get-initial-data.use-case.js";
import { UploadDataUseCase } from "../use-cases/sync/upload-data.use-case.js";
import { AppError } from "../middleware/error.js";

export const syncRouter = Router();

/**
 * GET /sync/initial
 * Retorna todos os dados iniciais do usuário (produtos, clientes, vendas)
 * Requer autenticação (Bearer token)
 */
syncRouter.get("/initial", userMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
        code: "UNAUTHENTICATED",
      });
    }

    const useCase = new GetInitialDataUseCase();
    const data = await useCase.execute(req.userId);

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[SYNC] Erro ao buscar dados iniciais:", error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao buscar dados iniciais",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * POST /sync/upload
 * Recebe dados do cliente para sincronizar na nuvem
 * Requer autenticação (Bearer token)
 * 
 * Aceita produtos, clientes e vendas do desktop e os salva no banco PostgreSQL
 */
syncRouter.post("/upload", userMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
        code: "UNAUTHENTICATED",
      });
    }

    console.log("[SYNC] POST /sync/upload - Requisição recebida");
    console.log("[SYNC] User ID:", req.userId);
    console.log("[SYNC] Dados recebidos:", {
      products: req.body.products?.length || 0,
      customers: req.body.customers?.length || 0,
      sales: req.body.sales?.length || 0,
    });

    const useCase = new UploadDataUseCase();
    const result = await useCase.execute(req.userId, {
      products: req.body.products,
      customers: req.body.customers,
      sales: req.body.sales,
    });

    console.log("[SYNC] ✅ Upload concluído:", result);

    res.status(200).json({
      success: true,
      message: "Dados sincronizados com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("[SYNC] ❌ Erro no upload:", error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao fazer upload",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// Placeholder: outras rotas de sync
syncRouter.post("/", userMiddleware, (_req, res) => {
  res.status(501).json({ message: "POST /sync – em implementação" });
});

syncRouter.get("/", userMiddleware, (_req, res) => {
  res.status(501).json({ message: "GET /sync – em implementação" });
});
