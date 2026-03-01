import { randomUUID } from "crypto";
import { db } from "../../db/client.js";

export class GenerateRegistrationKeyUseCase {
  async execute(): Promise<{ registrationKey: string }> {
    const registrationKey = randomUUID();
    console.log("[USE-CASE] Chave gerada:", registrationKey);
    
    // Salvar a chave no banco de dados
    console.log("[USE-CASE] Salvando chave no banco de dados...");
    const savedKey = await db.registrationKey.create({
      data: {
        key: registrationKey,
        used: false,
      },
    });
    console.log("[USE-CASE] Chave salva no banco com sucesso! ID:", savedKey.id);
    
    return { registrationKey };
  }
}

