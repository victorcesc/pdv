import { Router } from "express";

export const notasRouter = Router();

// Placeholder: rotas de notas serão implementadas no passo de Config e DB + serviço NF-e
notasRouter.get("/", (_req, res) => {
  res.json({ message: "Notas routes – em implementação", data: [] });
});
