// src/cli/prompts.ts
// Purpose: Handle all user input collection

import * as readline from "readline";
import { DEFAULT_EXAMPLE_ARTICLE, DEFAULT_METADATA, SECOND_DEFAULT_EXAMPLE_ARTICLE, SECOND_DEFAULT_METADATA } from "./examples";
import { createLogger } from "@utils/logger";

const logger = createLogger("Prompts");

interface IUserInput {
  text: string;
  metadata?: any;
  source: "default" | "url" | "text";
}

/**
 * Collect input from the user via interactive prompts
 */
export async function collectUserInput(): Promise<IUserInput> {
  const rl = createReadlineInterface();

  console.log("\n📋 Bias & Fallacy Detector - Input Options\n");
  console.log("1. Use default example article (for testing)");
  console.log("2. Use second default example article (for testing)");
  console.log("3. Enter a URL to analyze");
  console.log("4. Paste your own text\n");

  const choice =
    (await askQuestion(rl, "Select option (1-3, default: 1): ")).trim() || "1";

  let result: IUserInput;

  switch (choice) {
    case "1":
      result = handleDefaultExample();
      break;
    case "2":
      result = handleSecondDefaultExample();
      break;
    case "3":
      result = await handleUrlInput(rl);
      break;
    case "4":
      result = await handleTextInput(rl);
      break;
    default:
      logger.warn("Invalid choice, using default example");
      result = handleDefaultExample();
  }

  rl.close();
  return result;
}

/**
 * Handle default example selection
 */
function handleDefaultExample(): IUserInput {
  logger.info("Using default example article for testing");
  return {
    text: DEFAULT_EXAMPLE_ARTICLE,
    metadata: DEFAULT_METADATA,
    source: "default",
  };
}
/**
 * Handle second default example selection
 */
function handleSecondDefaultExample(): IUserInput {
  logger.info("Using second default example article for testing");
  return {
    text: SECOND_DEFAULT_EXAMPLE_ARTICLE,
    metadata: SECOND_DEFAULT_METADATA,
    source: "default",
  };
}
/**
 * Handle URL input
 */
async function handleUrlInput(rl: readline.Interface): Promise<IUserInput> {
  const url = (await askQuestion(rl, "\nEnter article URL: ")).trim();

  if (!url) {
    logger.warn("No URL provided, using default example");
    return handleDefaultExample();
  }

  return { text: url, source: "url" };
}

/**
 * Handle text paste input
 */
async function handleTextInput(rl: readline.Interface): Promise<IUserInput> {
  console.log("\nPaste your text (press Enter twice when done):");

  const text = await collectMultilineText();

  if (!text) {
    logger.warn("No text provided, using default example");
    return handleDefaultExample();
  }

  return { text, source: "text" };
}

/**
 * Collect multiline text input from user
 */
function collectMultilineText(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    const textLines: string[] = [];
    let emptyLineCount = 0;

    rl.on("line", (line) => {
      if (line.trim() === "") {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
          resolve(textLines.join("\n").trim());
        }
      } else {
        emptyLineCount = 0;
        textLines.push(line);
      }
    });
  });
}

/**
 * Create readline interface
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a single question and wait for answer
 */
function askQuestion(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}
