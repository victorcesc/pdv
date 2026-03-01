import { db } from "../../db/client.js";
import { AppError } from "../../middleware/error.js";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

export interface RegisterInput {
  login: string;
  email?: string;
  password: string;
  name: string;
  registrationKey: string;
}

export interface RegisterOutput {
  token: string;
  user: {
    id: number;
    login: string;
    email?: string | null;
    name: string;
  };
}

export class RegisterUseCase {
  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const { login, email, password, name, registrationKey } = input;

    // Validação básica
    console.log("[USE-CASE] Validando campos obrigatórios...");
    if (!login || !password || !name || !registrationKey) {
      console.log("[USE-CASE] ❌ Validação falhou: campos obrigatórios ausentes");
      throw new AppError(
        "Todos os campos são obrigatórios: login, password, name, registrationKey",
        400,
        "VALIDATION_ERROR"
      );
    }
    console.log("[USE-CASE] ✅ Todos os campos obrigatórios presentes");

    // Verificar se o login já está em uso
    console.log("[USE-CASE] Verificando se login já está em uso:", login);
    const existingUser = await db.user.findUnique({
      where: { login },
    });

    if (existingUser) {
      console.log("[USE-CASE] ❌ Login já está em uso");
      throw new AppError("Login já está em uso", 409, "LOGIN_ALREADY_EXISTS");
    }
    console.log("[USE-CASE] ✅ Login disponível");

    // Verificar se a chave de registro existe e não foi usada
    console.log("[USE-CASE] Buscando chave de registro no banco...");
    const key = await db.registrationKey.findUnique({
      where: { key: registrationKey },
    });

    if (!key) {
      console.log("[USE-CASE] ❌ Chave de registro não encontrada no banco");
      throw new AppError("Chave de registro inválida", 400, "INVALID_REGISTRATION_KEY");
    }
    console.log("[USE-CASE] ✅ Chave encontrada no banco. ID:", key.id, "| Usada:", key.used);

    if (key.used) {
      console.log("[USE-CASE] ❌ Chave já foi utilizada. Usada em:", key.usedAt, "| Por usuário ID:", key.usedBy);
      throw new AppError("Chave de registro já foi utilizada", 400, "REGISTRATION_KEY_ALREADY_USED");
    }

    // Verificar se a chave expirou (se tiver data de expiração)
    if (key.expiresAt) {
      console.log("[USE-CASE] Verificando expiração da chave. Expira em:", key.expiresAt);
      if (key.expiresAt < new Date()) {
        console.log("[USE-CASE] ❌ Chave expirada");
        throw new AppError("Chave de registro expirada", 400, "REGISTRATION_KEY_EXPIRED");
      }
      console.log("[USE-CASE] ✅ Chave ainda válida");
    }

    // Hash da senha
    console.log("[USE-CASE] Gerando hash da senha...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[USE-CASE] ✅ Hash da senha gerado");

    // Criar usuário e marcar chave como usada em uma transação
    console.log("[USE-CASE] Iniciando transação para criar usuário e marcar chave como usada...");
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Criar o usuário
      console.log("[USE-CASE] Criando usuário no banco...");
      const user = await tx.user.create({
        data: {
          login,
          email: email || null,
          name,
          password: hashedPassword,
        },
      });
      console.log("[USE-CASE] ✅ Usuário criado com sucesso! ID:", user.id, "| Login:", user.login);

      // Marcar a chave como usada
      console.log("[USE-CASE] Marcando chave como usada...");
      await tx.registrationKey.update({
        where: { id: key.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedBy: user.id,
        },
      });
      console.log("[USE-CASE] ✅ Chave marcada como usada");

      return user;
    });
    console.log("[USE-CASE] ✅ Transação concluída com sucesso");

    // TODO: Implementar JWT token real
    // Por enquanto, retornar um token simples (em produção, usar JWT)
    const token = `token_${result.id}_${Date.now()}`;
    console.log("[USE-CASE] Token gerado para usuário ID:", result.id);

    return {
      token,
      user: {
        id: result.id,
        login: result.login,
        email: result.email,
        name: result.name,
      },
    };
  }
}

