import { Request, Response, NextFunction } from "express";
import { db } from "../db/client.js";
import { AppError } from "./error.js";
import { log, logError } from "../utils/logger.js";

// Estender o tipo Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      empresaId?: number;
    }
  }
}

/**
 * Middleware para extrair e validar o usuário do token
 * Por enquanto, o token é simples: "token_{userId}_{timestamp}"
 * TODO: Implementar JWT real
 */
export async function userMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    log("[USER-MIDDLEWARE] ========================================");
    log("[USER-MIDDLEWARE] ⚡ Middleware chamado!");
    log("[USER-MIDDLEWARE] Rota:", req.path, "| Método:", req.method);
    log("[USER-MIDDLEWARE] URL completa:", req.url);
    const authHeader = req.headers.authorization;
    
    log("[USER-MIDDLEWARE] Authorization header:", authHeader ? `"${authHeader.substring(0, 50)}..."` : "ausente");
    log("[USER-MIDDLEWARE] Authorization header completo:", authHeader);
    log("[USER-MIDDLEWARE] Todos os headers recebidos:", Object.keys(req.headers));
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      log("[USER-MIDDLEWARE] ❌ Token não fornecido ou formato inválido");
      log("[USER-MIDDLEWARE] Header recebido:", authHeader);
      next(new AppError("Token não fornecido", 401, "UNAUTHORIZED"));
      return;
    }

    const token = authHeader.replace("Bearer ", "").trim();
    log("[USER-MIDDLEWARE] Token extraído (primeiros 50 chars):", token.substring(0, 50));
    
    // Por enquanto, token é "token_{userId}_{timestamp}"
    // TODO: Implementar JWT real
    const tokenParts = token.split("_");
    log("[USER-MIDDLEWARE] Token parts:", tokenParts);
    
    if (tokenParts.length < 2 || tokenParts[0] !== "token") {
      log("[USER-MIDDLEWARE] ❌ Formato de token inválido");
      log("[USER-MIDDLEWARE] Token completo:", token);
      next(new AppError("Token inválido", 401, "INVALID_TOKEN"));
      return;
    }

    const userId = parseInt(tokenParts[1], 10);
    
    if (isNaN(userId)) {
      log("[USER-MIDDLEWARE] ❌ userId não é um número válido");
      log("[USER-MIDDLEWARE] TokenParts[1]:", tokenParts[1]);
      next(new AppError("Token inválido", 401, "INVALID_TOKEN"));
      return;
    }

    log("[USER-MIDDLEWARE] Buscando usuário ID:", userId);

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      log("[USER-MIDDLEWARE] ❌ Usuário não encontrado para ID:", userId);
      next(new AppError("Usuário não encontrado", 401, "USER_NOT_FOUND"));
      return;
    }

    // Adicionar userId e empresaId ao request
    req.userId = user.id;
    if (user.empresa?.id) {
      req.empresaId = user.empresa.id;
    }

    log("[USER-MIDDLEWARE] ✅ Usuário autenticado - ID:", user.id, "| Login:", user.login, "| Empresa ID:", req.empresaId);
    
    if (!req.empresaId) {
      log("[USER-MIDDLEWARE] ⚠️  Usuário não tem empresa cadastrada");
    }
    
    next();
  } catch (error) {
    logError("[USER-MIDDLEWARE] ❌ Erro ao validar token:", error);
    logError("[USER-MIDDLEWARE] Stack:", error instanceof Error ? error.stack : "N/A");
    next(new AppError("Erro ao validar token", 500, "INTERNAL_ERROR"));
  }
}

