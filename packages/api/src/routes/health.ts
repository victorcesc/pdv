import { Router, Request, Response } from "express";
import { db } from "../db/client.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | undefined;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  res.status(200).json({
    status: "ok",
    timestamp,
    service: "pdv-cloud-api",
    database: {
      status: dbStatus,
      ...(dbError && { error: dbError }),
    },
  });
});
