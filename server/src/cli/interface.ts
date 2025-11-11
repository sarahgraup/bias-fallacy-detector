// src/cli/interface.ts
// Purpose: Orchestrates the interactive CLI flow

import { BiasDetectorService } from "../service";
import { collectUserInput } from "./prompts";
import { printHeader, printResults } from "@utils/formatter";
import { createLogger } from "@utils/logger";

const logger = createLogger("CLI");

/**
 * Run the interactive command-line interface
 * Handles user input, runs analysis, and displays results
 */
export async function runInteractiveCLI(): Promise<void> {
  // Show welcome header
  printHeader();

  logger.info("Initializing Bias Detection System...\n");

  // Collect user input
  const input = await collectUserInput();

  // Initialize service
  logger.info("Initializing workflow and agents...");
  const service = new BiasDetectorService();
  logger.success("Workflow ready\n");

  // Get text and metadata based on input source
  const { text, metadata } = await getTextAndMetadata(service, input);

  // Run analysis
  logger.info("Starting bias detection analysis...\n");
  console.log("─".repeat(60));
  console.log();

  const startTime = Date.now();
  const result = await service.analyzeText(text, metadata);
  const totalTime = (Date.now() - startTime) / 1000;

  console.log();
  console.log("─".repeat(60));
  logger.success(`\nAnalysis completed in ${totalTime.toFixed(2)}s\n`);

  // Display results
  printResults(result, metadata);
}

/**
 * Get text and metadata based on input source
 */
async function getTextAndMetadata(
  service: BiasDetectorService,
  input: { text: string; metadata?: any; source: string }
): Promise<{ text: string; metadata?: any }> {
  if (input.source === "url") {
    logger.info(`📰 Scraping article from: ${input.text}\n`);

    // Use service's scrapeArticle method
    const scraper = (service as any).scraper;
    const scraped = await scraper.scrapeArticle(input.text);

    return {
      text: scraped.text,
      metadata: scraped.metadata,
    };
  }

  return {
    text: input.text,
    metadata: input.metadata,
  };
}
