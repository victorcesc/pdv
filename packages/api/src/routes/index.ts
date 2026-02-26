import { Router } from "express";
import { healthRouter } from "./health.js";
import { notasRouter } from "./notas.js";
import { syncRouter } from "./sync.js";
import { authRouter } from "./auth.js";

export function createRouter(): Router {
  const router = Router();
  router.use("/health", healthRouter);
  router.use("/notas", notasRouter);
  router.use("/sync", syncRouter);
  router.use("/auth", authRouter);
  return router;
}
