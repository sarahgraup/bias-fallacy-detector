import dotenv from "dotenv";

// Load environment variables
const result1 = dotenv.config({ path: ".env.local" });
const result2 = dotenv.config({ path: ".env" });

// Debug output
// console.log("\n🔍 Debug Information:");
// console.log("=".repeat(50));
// console.log("Current directory:", process.cwd());
// console.log(".env.local loaded:", result1.error ? "❌ Error" : "✅ Success");
// if (result1.error) console.log("Error:", result1.error.message);
// console.log(".env loaded:", result2.error ? "❌ Error" : "✅ Success");
// console.log("=".repeat(50));

// console.log("\n🔑 Environment Variables:");
// console.log("=".repeat(50));
// console.log(
//   "OPENAI_API_KEY:",
//   process.env.OPENAI_API_KEY ? "✅ SET" : "❌ NOT SET"
// );
// if (process.env.OPENAI_API_KEY) {
//   console.log(
//     "  Starts with:",
//     process.env.OPENAI_API_KEY.substring(0, 10) + "..."
//   );
//   console.log("  Length:", process.env.OPENAI_API_KEY.length);
// }
// console.log("NODE_ENV:", process.env.NODE_ENV || "❌ NOT SET");
// console.log("MODEL_NAME:", process.env.MODEL_NAME || "❌ NOT SET");
// console.log("=".repeat(50));

// // If API key is missing, exit with instructions
// if (!process.env.OPENAI_API_KEY) {
//   console.error("\n❌ ERROR: OPENAI_API_KEY not found!");
//   console.error("\nPlease create .env.local file with:");
//   console.error("OPENAI_API_KEY=sk-proj-your-key-here");
//   process.exit(1);
// }

// src/index.ts
// Purpose: Entry point for interactive terminal application
import { runInteractiveCLI } from "@cli/interface";
import { createLogger } from "@utils/logger";

const logger = createLogger("Main");

async function main() {
  try {
    await runInteractiveCLI();
    process.exit(0);
  } catch (error) {
    logger.error("Fatal error during execution", error as Error);
    process.exit(1);
  }
}

// Error handlers
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", new Error(String(reason)));
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Only run if this is the main module
if (require.main === module) {
  main();
}
