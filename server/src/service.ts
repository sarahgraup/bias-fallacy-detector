// src/service.ts
// Purpose: Programmatic API for bias detection (use in other applications)

import { BiasDetectionWorkflow } from "@workflows/BiasDetectionWorkflow";
import { ArticleScraper } from "@utils/ArticleScraper";
import { IFinalOutput, IArticleMetadata } from "@utils/types";
import biasesConfig from "@config/biases_fallacies.json";

/**
 * BiasDetectorService - Main service class for programmatic access
 *
 * @example
 * // Use in your own application
 * const detector = new BiasDetectorService();
 * const result = await detector.analyzeText('Some biased text...');
 * console.log(result.articleAnalysis.credibilityScore);
 */
export class BiasDetectorService {
  private workflow: BiasDetectionWorkflow;
  private scraper: ArticleScraper;

  constructor() {
    this.workflow = new BiasDetectionWorkflow(biasesConfig);
    this.scraper = new ArticleScraper();
  }

  /**
   * Analyze text directly
   *
   * @param text - The text content to analyze
   * @param metadata - Optional article metadata
   * @returns Analysis results with detections, explanations, and article analysis
   */
  async analyzeText(
    text: string,
    metadata?: IArticleMetadata
  ): Promise<IFinalOutput> {
    return await this.workflow.analyze(text, metadata);
  }

  /**
   * Analyze article from URL
   *
   * @param url - URL of the article to scrape and analyze
   * @returns Analysis results with detections, explanations, and article analysis
   */
  async analyzeUrl(url: string): Promise<IFinalOutput> {
    const { text, metadata } = await this.scraper.scrapeArticle(url);
    return await this.workflow.analyze(text, metadata);
  }

  /**
   * Analyze uploaded file (PDF or TXT)
   *
   * @param fileBuffer - File buffer
   * @param fileType - MIME type of the file
   * @param metadata - Optional article metadata
   * @returns Analysis results with detections, explanations, and article analysis
   */
  async analyzeFile(
    fileBuffer: Buffer,
    fileType: string,
    metadata?: IArticleMetadata
  ): Promise<IFinalOutput> {
    const text = await this.scraper.extractFromFile(fileBuffer, fileType);
    return await this.workflow.analyze(text, metadata);
  }
}

export default BiasDetectorService;
