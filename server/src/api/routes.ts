// src/api/routes.ts
// Purpose: Define all API endpoints

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import BiasDetectorService from "service";
import { BadRequestError } from "expressError";
import { createLogger } from "@utils/logger";

const router = Router();
const logger = createLogger("Routes");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Initialize service (singleton)
const detector = new BiasDetectorService();

/**
 * GET /health
 * Health check endpoint
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Bias Detector API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /analyze/text
 * Analyze text directly
 *
 * Body: { text: string, metadata?: object }
 */
router.post(
  "/analyze/text",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, metadata } = req.body;

      if (!text || typeof text !== "string") {
        throw new BadRequestError("Text is required and must be a string");
      }

      if (text.trim().length === 0) {
        throw new BadRequestError("Text cannot be empty");
      }

      logger.info("Analyzing text...");
      const startTime = Date.now();

      const result = await detector.analyzeText(text, metadata);

      const processingTime = Date.now() - startTime;
      logger.success(`Analysis completed in ${processingTime}ms`);

      res.json({
        success: true,
        data: result,
        processingTime,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /analyze/url
 * Analyze article from URL
 *
 * Body: { url: string }
 */
router.post(
  "/analyze/url",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== "string") {
        throw new BadRequestError("URL is required and must be a string");
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new BadRequestError("Invalid URL format");
      }

      logger.info(`Analyzing URL: ${url}`);
      const startTime = Date.now();

      const result = await detector.analyzeUrl(url);

      const processingTime = Date.now() - startTime;
      logger.success(`Analysis completed in ${processingTime}ms`);

      res.json({
        success: true,
        data: result,
        processingTime,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /analyze/file
 * Analyze uploaded file (PDF or TXT)
 *
 * Form data: file (multipart/form-data), metadata (optional JSON string)
 */
router.post(
  "/analyze/file",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError("File is required");
      }

      const { mimetype, buffer, originalname } = req.file;

      // Validate file type
      const allowedTypes = ["application/pdf", "text/plain"];
      if (!allowedTypes.includes(mimetype)) {
        throw new BadRequestError("File must be PDF or TXT format");
      }

      // Parse metadata if provided
      let metadata;
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch {
          throw new BadRequestError("Invalid metadata JSON");
        }
      }

      logger.info(`Analyzing file: ${originalname}`);
      const startTime = Date.now();

      const result = await detector.analyzeFile(buffer, mimetype, metadata);

      const processingTime = Date.now() - startTime;
      logger.success(`Analysis completed in ${processingTime}ms`);

      res.json({
        success: true,
        data: result,
        processingTime,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
