import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
  }

  if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
    return res.status(409).json({ success: false, message: "A record with this value already exists." });
  }

  if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found." });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Internal server error" : message });
}
