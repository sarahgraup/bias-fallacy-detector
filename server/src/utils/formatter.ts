// src/utils/formatter.ts
// Purpose: Format and display analysis results in a beautiful, readable way

import { IFinalOutput, IArticleMetadata, IValidatedDetection } from "./types";

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
} as const;

/**
 * Print the application header (ASCII art banner)
 */
export function printHeader(): void {
  console.clear();
  console.log(colors.cyan + colors.bright);
  console.log(
    "╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "║           🎯  BIAS & FALLACY DETECTOR  🎯                   ║"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "║        Identify Cognitive Biases & Logical Fallacies        ║"
  );
  console.log(
    "║                  in News Articles & Text                     ║"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝"
  );
  console.log(colors.reset);
}

/**
 * Print the complete analysis results
 *
 * @param result - The analysis output from the workflow
 * @param metadata - Optional article metadata
 */
export function printResults(
  result: IFinalOutput,
  metadata?: IArticleMetadata
): void {
  console.log("\n" + "═".repeat(60));
  console.log(
    colors.bright + colors.cyan + "📊  ANALYSIS RESULTS" + colors.reset
  );
  console.log("═".repeat(60) + "\n");

  // Article metadata
  if (metadata) {
    printMetadata(metadata);
  }

  // Executive summary
  printSummary(result);

  // Article analysis
  printArticleAnalysis(result);

  // Detections
  printDetections(result);

  // Explanations
  printExplanations(result);

  console.log("\n" + "═".repeat(60) + "\n");
}

/**
 * Print article metadata section
 */
function printMetadata(metadata: IArticleMetadata): void {
  console.log(colors.bright + "📰 Article Information" + colors.reset);
  console.log("─".repeat(60));

  if (metadata.title) {
    console.log(`${colors.bright}Title:${colors.reset} ${metadata.title}`);
  }
  if (metadata.source) {
    console.log(`${colors.bright}Source:${colors.reset} ${metadata.source}`);
  }
  if (metadata.author) {
    console.log(`${colors.bright}Author:${colors.reset} ${metadata.author}`);
  }
  if (metadata.publishDate) {
    const date = new Date(metadata.publishDate);
    console.log(
      `${colors.bright}Published:${colors.reset} ${date.toLocaleDateString()}`
    );
  }
  if (metadata.url) {
    console.log(
      `${colors.bright}URL:${colors.reset} ${colors.dim}${metadata.url}${colors.reset}`
    );
  }

  console.log();
}

/**
 * Print executive summary section
 */
function printSummary(result: IFinalOutput): void {
  console.log(colors.bright + "📋 Executive Summary" + colors.reset);
  console.log("─".repeat(60));
  console.log(result.summary);
  console.log();
}

/**
 * Print overall article analysis section
 */
function printArticleAnalysis(result: IFinalOutput): void {
  const analysis = result.articleAnalysis;

  console.log(colors.bright + "🔍 Overall Article Analysis" + colors.reset);
  console.log("─".repeat(60));

  // Tone and credibility
  const toneColor = getToneColor(analysis.overallTone);
  console.log(
    `${colors.bright}Overall Tone:${colors.reset} ${toneColor}${analysis.overallTone}${colors.reset} ` +
      `${colors.dim}(${(analysis.confidenceInTone * 100).toFixed(
        0
      )}% confidence)${colors.reset}`
  );

  const credibilityColor = getCredibilityColor(analysis.credibilityScore);
  console.log(
    `${colors.bright}Credibility Score:${colors.reset} ${credibilityColor}${analysis.credibilityScore}/10${colors.reset}`
  );
  console.log();

  // Primary intent
  console.log(`${colors.bright}Primary Intent:${colors.reset}`);
  console.log(`  ${analysis.primaryIntent}`);
  console.log();

  // Manipulation techniques
  if (
    analysis.manipulationTechniques &&
    analysis.manipulationTechniques.length > 0
  ) {
    console.log(
      `${colors.bright}Manipulation Techniques Detected:${colors.reset}`
    );
    analysis.manipulationTechniques.forEach((tech) => {
      console.log(`  ${colors.red}•${colors.reset} ${tech}`);
    });
    console.log();
  }

  // Omitted perspectives
  if (analysis.omittedPerspectives && analysis.omittedPerspectives.length > 0) {
    console.log(`${colors.bright}Missing Perspectives:${colors.reset}`);
    analysis.omittedPerspectives.forEach((persp) => {
      console.log(`  ${colors.yellow}•${colors.reset} ${persp}`);
    });
    console.log();
  }

  // Emotional language
  if (
    analysis.emotionalLanguage &&
    analysis.emotionalLanguage.overallEmotionalIntensity > 0.3
  ) {
    console.log(`${colors.bright}Emotional Language Analysis:${colors.reset}`);
    console.log(
      `  ${colors.bright}Intensity:${colors.reset} ${colors.magenta}${(
        analysis.emotionalLanguage.overallEmotionalIntensity * 100
      ).toFixed(0)}%${colors.reset}`
    );

    if (
      analysis.emotionalLanguage.fearWords &&
      analysis.emotionalLanguage.fearWords.length > 0
    ) {
      console.log(
        `  ${colors.bright}Fear words:${
          colors.reset
        } ${analysis.emotionalLanguage.fearWords.join(", ")}`
      );
    }
    if (
      analysis.emotionalLanguage.outrageTriggers &&
      analysis.emotionalLanguage.outrageTriggers.length > 0
    ) {
      console.log(
        `  ${colors.bright}Outrage triggers:${
          colors.reset
        } ${analysis.emotionalLanguage.outrageTriggers.join(", ")}`
      );
    }
    if (
      analysis.emotionalLanguage.loadedTerms &&
      analysis.emotionalLanguage.loadedTerms.length > 0
    ) {
      console.log(
        `  ${colors.bright}Loaded terms:${
          colors.reset
        } ${analysis.emotionalLanguage.loadedTerms.join(", ")}`
      );
    }
    console.log();
  }

  // Source credibility
  if (
    analysis.sourceCredibility &&
    analysis.sourceCredibility.sourcesListed &&
    analysis.sourceCredibility.sourcesListed.length > 0
  ) {
    console.log(`${colors.bright}Source Credibility:${colors.reset}`);
    console.log(
      `  ${colors.bright}Balance Score:${colors.reset} ${(
        analysis.sourceCredibility.balanceScore * 100
      ).toFixed(0)}%`
    );
    console.log(
      `  ${colors.bright}Sources:${
        colors.reset
      } ${analysis.sourceCredibility.sourcesListed.join(", ")}`
    );

    if (
      analysis.sourceCredibility.concerns &&
      analysis.sourceCredibility.concerns.length > 0
    ) {
      console.log(`  ${colors.bright}Concerns:${colors.reset}`);
      analysis.sourceCredibility.concerns.forEach((concern) => {
        console.log(`    ${colors.yellow}⚠${colors.reset} ${concern}`);
      });
    }
    console.log();
  }
}

/**
 * Print detected biases and fallacies section
 */
function printDetections(result: IFinalOutput): void {
  if (!result.detections || result.detections.length === 0) {
    console.log(
      colors.green +
        "✓ No significant biases or fallacies detected" +
        colors.reset
    );
    console.log();
    return;
  }

  console.log(colors.bright + "🎯 Detected Biases & Fallacies" + colors.reset);
  console.log("─".repeat(60));

  // Group by sentence
  const bySentence = groupDetectionsBySentence(result.detections);

  bySentence.forEach(({ sentence, detections }, index) => {
    console.log(
      `\n${colors.bright}[${index + 1}]${colors.reset} ${
        colors.dim
      }"${truncateText(sentence, 100)}"${colors.reset}`
    );
    console.log();

    detections.forEach((detection) => {
      const severityColor = getSeverityColor(detection.confidence);
      const typeIcon = detection.type === "bias" ? "🧠" : "⚠️";

      console.log(
        `  ${typeIcon} ${colors.bright}${detection.name}${colors.reset}`
      );
      console.log(
        `     ${colors.dim}Confidence:${colors.reset} ${severityColor}${(
          detection.confidence * 100
        ).toFixed(0)}%${colors.reset} ` +
          `${colors.dim}| Source: ${detection.sourceDetector}${colors.reset}`
      );

      if (detection.quotedText) {
        console.log(
          `     ${colors.dim}Phrase:${colors.reset} "${colors.yellow}${detection.quotedText}${colors.reset}"`
        );
      }

      if (detection.validationReasoning) {
        console.log(
          `     ${colors.dim}${detection.validationReasoning}${colors.reset}`
        );
      }
      console.log();
    });
  });
}

/**
 * Print explanations section
 */
function printExplanations(result: IFinalOutput): void {
  if (!result.explanations || result.explanations.length === 0) return;

  console.log(colors.bright + "💡 Understanding These Biases" + colors.reset);
  console.log("─".repeat(60));

  result.explanations.forEach((explanation, index) => {
    console.log(
      `\n${colors.cyan}${index + 1}. ${explanation.biasOrFallacyName}${
        colors.reset
      }`
    );
    console.log();

    console.log(`${colors.bright}What it is:${colors.reset}`);
    console.log(`  ${explanation.simpleExplanation}`);
    console.log();

    console.log(`${colors.bright}Why it's problematic:${colors.reset}`);
    console.log(`  ${explanation.whyProblematic}`);
    console.log();

    console.log(`${colors.bright}In this context:${colors.reset}`);
    console.log(`  ${explanation.inContext}`);

    if (explanation.alternativeFraming) {
      console.log();
      console.log(`${colors.bright}Better approach:${colors.reset}`);
      console.log(
        `  ${colors.green}${explanation.alternativeFraming}${colors.reset}`
      );
    }

    console.log();
  });
}

/**
 * Helper: Get color based on tone
 */
function getToneColor(tone: string): string {
  switch (tone) {
    case "neutral":
      return colors.green;
    case "left-leaning":
    case "right-leaning":
      return colors.yellow;
    case "heavily-biased":
      return colors.red;
    default:
      return colors.reset;
  }
}

/**
 * Helper: Get color based on credibility score
 */
function getCredibilityColor(score: number): string {
  if (score >= 7) return colors.green;
  if (score >= 4) return colors.yellow;
  return colors.red;
}

/**
 * Helper: Get color based on confidence severity
 */
function getSeverityColor(confidence: number): string {
  if (confidence >= 0.8) return colors.red;
  if (confidence >= 0.6) return colors.yellow;
  return colors.blue;
}

/**
 * Helper: Group detections by sentence
 */
function groupDetectionsBySentence(detections: IValidatedDetection[]): Array<{
  sentence: string;
  detections: IValidatedDetection[];
}> {
  const groups: Map<string, IValidatedDetection[]> = new Map();

  detections.forEach((detection) => {
    const sentence = detection.sentence || "Unknown sentence";
    if (!groups.has(sentence)) {
      groups.set(sentence, []);
    }
    groups.get(sentence)!.push(detection);
  });

  return Array.from(groups.entries()).map(([sentence, detections]) => ({
    sentence,
    detections,
  }));
}

/**
 * Helper: Truncate text to a maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Helper: Create a horizontal line
 */
export function printSeparator(length: number = 60, char: string = "─"): void {
  console.log(char.repeat(length));
}

/**
 * Helper: Print a section header
 */
export function printSectionHeader(title: string, icon: string = ""): void {
  const header = icon ? `${icon} ${title}` : title;
  console.log(`\n${colors.bright}${header}${colors.reset}`);
  printSeparator();
}
