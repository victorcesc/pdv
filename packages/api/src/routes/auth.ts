import { Router, Request, Response } from "express";
import { AppError } from "../middleware/error.js";
import { userMiddleware } from "../middleware/user.js";
import { GenerateRegistrationKeyUseCase } from "../use-cases/auth/generate-registration-key.use-case.js";
import { RegisterUseCase } from "../use-cases/auth/register.use-case.js";
import { LoginUseCase } from "../use-cases/auth/login.use-case.js";
import { db } from "../db/client.js";

export const authRouter = Router();

/**
 * POST /auth/generate-registration-key
 * Gera um UUID único para ser usado como chave de registro
 * Este UUID será enviado para o usuário que assinou para que ele possa se cadastrar na plataforma
 */
authRouter.post("/generate-registration-key", async (_req: Request, res: Response) => {
  console.log("[AUTH] POST /auth/generate-registration-key - Requisição recebida");
  
  try {
    const useCase = new GenerateRegistrationKeyUseCase();
    const { registrationKey } = await useCase.execute();
    
    console.log("[AUTH] Chave gerada:", registrationKey);
    console.log("[AUTH] Resposta enviada com sucesso");
    
    res.status(200).json({
      success: true,
      registrationKey,
      message: "Chave de registro gerada com sucesso",
    });
  } catch (error) {
    console.error("[AUTH] Erro ao gerar chave de registro:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar chave de registro",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /auth/register
 * Registra um novo usuário usando uma chave de registro válida
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  console.log("[AUTH] POST /auth/register - Requisição recebida");
  console.log("[AUTH] Dados recebidos:", {
    login: req.body.login,
    email: req.body.email,
    name: req.body.name,
    cnpj: req.body.cnpj,
    razaoSocial: req.body.razaoSocial,
    uf: req.body.uf,
    registrationKey: req.body.registrationKey ? `${req.body.registrationKey.substring(0, 8)}...` : "não informado",
  });

  try {
    const useCase = new RegisterUseCase();
    const result = await useCase.execute({
      login: req.body.login,
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      registrationKey: req.body.registrationKey,
      // Dados da empresa
      cnpj: req.body.cnpj,
      razaoSocial: req.body.razaoSocial,
      uf: req.body.uf,
      nomeFantasia: req.body.nomeFantasia,
      ie: req.body.ie,
      endereco: req.body.endereco,
    });

    console.log("[AUTH] ✅ Usuário registrado com sucesso! ID:", result.user.id);
    res.status(201).json(result);
  } catch (error) {
    console.error("[AUTH] ❌ Erro no registro:", error);
    if (error instanceof AppError) {
      console.log("[AUTH] Erro AppError - Status:", error.statusCode, "| Code:", error.code, "| Message:", error.message);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      console.log("[AUTH] Erro genérico:", error instanceof Error ? error.message : String(error));
      res.status(500).json({
        success: false,
        message: "Erro ao criar conta",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * POST /auth/login
 * Autentica um usuário com login e senha
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  console.log("[AUTH] POST /auth/login - Requisição recebida");
  console.log("[AUTH] Dados recebidos:", {
    login: req.body.login,
  });

  try {
    const useCase = new LoginUseCase();
    const result = await useCase.execute({
      login: req.body.login,
      password: req.body.password,
    });

    console.log("[AUTH] ✅ Login realizado com sucesso! ID:", result.user.id);
    res.status(200).json(result);
  } catch (error) {
    console.error("[AUTH] ❌ Erro no login:", error);
    console.error("[AUTH] Stack trace:", error instanceof Error ? error.stack : "N/A");
    if (error instanceof AppError) {
      console.log("[AUTH] Erro AppError - Status:", error.statusCode, "| Code:", error.code, "| Message:", error.message);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      console.log("[AUTH] Erro genérico:", error instanceof Error ? error.message : String(error));
      res.status(500).json({
        success: false,
        message: "Erro ao fazer login",
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      });
    }
  }
});

/**
 * GET /auth/me
 * Retorna os dados do usuário autenticado
 * Requer autenticação (Bearer token)
 */
authRouter.get("/me", userMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
        code: "UNAUTHENTICATED",
      });
    }

    console.log("[AUTH] GET /auth/me - Requisição recebida");
    console.log("[AUTH] User ID:", req.userId);

    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    console.log("[AUTH] ✅ Dados do usuário retornados:", user.id);
    res.status(200).json(user);
  } catch (error) {
    console.error("[AUTH] ❌ Erro ao buscar dados do usuário:", error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao buscar dados do usuário",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});


