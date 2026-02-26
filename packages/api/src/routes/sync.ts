import { Router } from "express";

export const syncRouter = Router();

// Placeholder: rotas de sync serão implementadas no passo de sync-service
syncRouter.post("/", (_req, res) => {
  res.status(501).json({ message: "POST /sync – em implementação" });
});
syncRouter.get("/", (_req, res) => {
  res.status(501).json({ message: "GET /sync – em implementação" });
});
