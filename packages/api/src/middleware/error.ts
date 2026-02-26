import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }
  if (err instanceof Error) {
    res.status(500).json({
      error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}
