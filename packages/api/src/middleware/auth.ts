import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "./error.js";
import { log } from "../utils/logger.js";

// Rotas públicas que não precisam de API_KEY
const PUBLIC_ROUTES = [
  "/health",
  "/auth/register",
  "/auth/login",
  "/auth/generate-registration-key", // Pode ser público ou protegido, dependendo da sua necessidade
];

// Rotas que usam Bearer token (userMiddleware) e não precisam de API_KEY
const USER_TOKEN_ROUTES = [
  "/sync/",
];

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Permitir requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  // Verificar se a rota é pública
  const isPublicRoute = PUBLIC_ROUTES.some((route) => req.path.startsWith(route));
  
  if (isPublicRoute) {
    log("[AUTH] 🌐 Rota pública - autenticação não requerida");
    next();
    return;
  }

  // Verificar se a rota usa Bearer token (userMiddleware)
  // Essas rotas não precisam de API_KEY, apenas do Bearer token
  const isUserTokenRoute = USER_TOKEN_ROUTES.some((route) => req.path.startsWith(route));
  
  if (isUserTokenRoute) {
    // Se tem Bearer token, permite passar (userMiddleware vai validar)
    const hasBearerToken = req.headers.authorization?.startsWith("Bearer ");
    if (hasBearerToken) {
      log("[AUTH] 🔑 Rota com Bearer token - permitindo (userMiddleware vai validar)");
      next();
      return;
    }
    // Se não tem Bearer token, ainda pode precisar de API_KEY (dependendo da configuração)
  }

  // Se API_KEY não estiver configurada, permite todas as requisições (modo desenvolvimento)
  // O userMiddleware vai verificar o token do usuário
  if (!env.API_KEY) {
    log("[AUTH] ⚠️  API_KEY não configurada - permitindo todas as requisições (userMiddleware vai validar token)");
    next();
    return;
  }

  // Se API_KEY estiver configurada, verificar apenas x-api-key
  // NÃO usar o token do usuário (authorization header) para comparar com API_KEY
  log("[AUTH] 🔐 Verificando API_KEY...");
  const apiKey = req.headers["x-api-key"];
  
  if (!apiKey) {
    log("[AUTH] ❌ x-api-key não fornecida na requisição");
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    return;
  }

  if (apiKey !== env.API_KEY) {
    log("[AUTH] ❌ API_KEY inválida. Recebida:", typeof apiKey === "string" ? apiKey.substring(0, 5) + "..." : apiKey);
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    return;
  }

  log("[AUTH] ✅ API_KEY válida");
  next();
}
