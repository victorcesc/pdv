import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "./error.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!env.API_KEY) {
    next();
    return;
  }
  const key = req.headers["x-api-key"] ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (key !== env.API_KEY) {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    return;
  }
  next();
}
