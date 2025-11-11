// src/utils/config.ts
// Purpose: Configuration management for Bias Detector (OpenAI)

import dotenv from "dotenv";
import { createLogger } from "./logger";

const logger = createLogger("Config");

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: envFile });
dotenv.config({ path: ".env.local" });

/**
 * Application configuration
 */
export const config = {
  /**
   * Environment settings
   */
  env: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  /**
   * Server configuration
   */
  port: parseInt(process.env.PORT || "3000", 10),
  debug: process.env.DEBUG === "true",

  /**
   * OpenAI API configuration
   */
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    organization: process.env.OPENAI_ORG_ID || undefined,
  },

  /**
   * Model configuration for bias detection
   */
  models: {
    /**
     * Primary model for analysis
     * Options:
     * - gpt-4o: Most capable, expensive
     * - gpt-4o-mini: Good balance of capability and cost
     * - gpt-4-turbo: Previous generation, still very capable
     * - gpt-3.5-turbo: Fastest, cheapest, less capable
     */
    primary: process.env.MODEL_NAME || "gpt-4o-mini",

    /**
     * Temperature settings for different analysis types
     * 0.0 = deterministic, 1.0 = creative
     */
    temperatures: {
      analytical: parseFloat(process.env.MODEL_TEMPERATURE_ANALYTICAL || "0.2"),
      balanced: parseFloat(process.env.MODEL_TEMPERATURE_BALANCED || "0.4"),
      creative: parseFloat(process.env.MODEL_TEMPERATURE_CREATIVE || "0.7"),
    },

    /**
     * Token limits for responses
     */
    maxTokens: {
      standard: parseInt(process.env.MAX_TOKENS_STANDARD || "2000", 10),
      extended: parseInt(process.env.MAX_TOKENS_EXTENDED || "4000", 10),
    },

    /**
     * Request timeout and retries
     */
    timeout: 60000, // 60 seconds
    maxRetries: 3,
  },

  /**
   * Rate limiting configuration (for API mode)
   */
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  /**
   * Logging configuration
   */
  logging: {
    level: (process.env.LOG_LEVEL || "info") as
      | "debug"
      | "info"
      | "warn"
      | "error",
    format: (process.env.LOG_FORMAT || "pretty") as "pretty" | "json",
  },

  /**
   * CORS configuration (for web frontend)
   */
  cors: {
    enabled: process.env.CORS_ENABLED === "true",
    origin: process.env.CORS_ORIGIN || "*",
  },

  /**
   * Analysis feature flags
   */
  features: {
    ruleBasedDetection: process.env.ENABLE_RULE_BASED_DETECTION !== "false",
    llmDetection: process.env.ENABLE_LLM_DETECTION !== "false",
    validation: false,
    explanations: process.env.ENABLE_EXPLANATIONS !== "false",
    framingAnalysis: process.env.ENABLE_FRAMING_ANALYSIS !== "false",
  },

  /**
   * Detection thresholds
   */
  thresholds: {
    minConfidence: parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD || "0.5"),
  },

  /**
   * Workflow configuration
   */
  workflow: {
    maxDetectionsToValidate: parseInt(
      process.env.MAX_DETECTIONS_TO_VALIDATE || "50",
      10
    ),
    maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH || "50000", 10),
  },
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Check OpenAI API key
  if (!config.openai.apiKey) {
    errors.push(
      "OPENAI_API_KEY is required. Get one at https://platform.openai.com/api-keys"
    );
  }

  if (config.openai.apiKey && !config.openai.apiKey.startsWith("sk-")) {
    errors.push("OPENAI_API_KEY appears to be invalid (should start with sk-)");
  }

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push("PORT must be between 1 and 65535");
  }

  // Validate temperatures
  if (
    config.models.temperatures.analytical < 0 ||
    config.models.temperatures.analytical > 1
  ) {
    errors.push("MODEL_TEMPERATURE_ANALYTICAL must be between 0 and 1");
  }

  if (
    config.models.temperatures.creative < 0 ||
    config.models.temperatures.creative > 1
  ) {
    errors.push("MODEL_TEMPERATURE_CREATIVE must be between 0 and 1");
  }

  // Validate token limits
  if (config.models.maxTokens.standard < 100) {
    errors.push("MAX_TOKENS_STANDARD must be at least 100");
  }

  if (config.models.maxTokens.extended < config.models.maxTokens.standard) {
    errors.push("MAX_TOKENS_EXTENDED must be greater than MAX_TOKENS_STANDARD");
  }

  // If there are errors, throw
  if (errors.length > 0) {
    logger.error("Configuration validation failed:");
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error(`Invalid configuration. Please check your .env file.`);
  }

  logger.success("Configuration validated successfully");
}

/**
 * Log current configuration (for debugging)
 */
export function logConfig(): void {
  if (config.isDevelopment && config.debug) {
    logger.debug("Current configuration:", {
      env: config.env,
      port: config.port,
      model: config.models.primary,
      features: config.features,
      thresholds: config.thresholds,
    });
  }
}

export type Config = typeof config;
