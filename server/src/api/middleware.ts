// src/api/middleware.ts
// Purpose: Express middleware for error handling and logging

import { Request, Response, NextFunction } from "express";
import { ExpressError, NotFoundError } from "expressError";
import { createLogger } from "@utils/logger";

const logger = createLogger("API");

/**
 * Catch-all for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  throw new NotFoundError(`Route ${req.method} ${req.path} not found`);
}

/**
 * Global error handler
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error (but not in tests)
  if (process.env.NODE_ENV !== "test") {
    logger.error("API Error:", err);
  }

  // Handle known ExpressError types
  if (err instanceof ExpressError) {
    return res.status(err.status).json({
      success: false,
      error: {
        message: err.message,
        status: err.status,
      },
    });
  }

  // Handle unknown errors
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
    },
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`${req.method} ${req.path}`);
  next();
}

/**
 * CORS middleware (if needed for web frontend)
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
}
