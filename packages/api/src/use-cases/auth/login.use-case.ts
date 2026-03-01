import { db } from "../../db/client.js";
import { AppError } from "../../middleware/error.js";
import bcrypt from "bcryptjs";

export interface LoginInput {
  login: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: {
    id: number;
    login: string;
    email?: string | null;
    name: string;
  };
}

export class LoginUseCase {
  async execute(input: LoginInput): Promise<LoginOutput> {
    const { login, password } = input;

    // Validação básica
    console.log("[USE-CASE] Validando campos obrigatórios...");
    if (!login || !password) {
      console.log("[USE-CASE] ❌ Validação falhou: login ou senha não informados");
      throw new AppError("Login e senha são obrigatórios", 400, "VALIDATION_ERROR");
    }
    console.log("[USE-CASE] ✅ Campos obrigatórios presentes");

    // Buscar usuário pelo login
    console.log("[USE-CASE] Buscando usuário pelo login:", login);
    let user;
    try {
      user = await db.user.findUnique({
        where: { login },
    });
    } catch (error) {
      console.error("[USE-CASE] ❌ Erro ao buscar usuário:", error);
      throw new AppError("Erro ao buscar usuário", 500, "DATABASE_ERROR");
    }

    if (!user) {
      console.log("[USE-CASE] ❌ Usuário não encontrado");
      throw new AppError("Login ou senha inválidos", 401, "INVALID_CREDENTIALS");
    }
    console.log("[USE-CASE] ✅ Usuário encontrado. ID:", user.id);

    // Verificar senha
    console.log("[USE-CASE] Verificando senha...");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("[USE-CASE] ❌ Senha inválida");
      throw new AppError("Login ou senha inválidos", 401, "INVALID_CREDENTIALS");
    }
    console.log("[USE-CASE] ✅ Senha válida");

    // TODO: Implementar JWT token real
    // Por enquanto, retornar um token simples (em produção, usar JWT)
    const token = `token_${user.id}_${Date.now()}`;
    console.log("[USE-CASE] Token gerado para usuário ID:", user.id);

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        name: user.name,
      },
    };
  }
}

