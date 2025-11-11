// src/utils/logger.ts
// Purpose: Colored console logging with timestamps

/**
 * Log levels for different types of messages
 */
type LogLevel = "info" | "success" | "warn" | "error" | "debug";

/**
 * Logger interface with typed methods
 */
interface ILogger {
  info(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error): void;
  debug(message: string, ...args: any[]): void;
}

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
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
 * Format a log message with color, timestamp, and namespace
 *
 * @param level - The log level (info, success, warn, error, debug)
 * @param namespace - The namespace/module name
 * @param message - The message to log
 * @returns Formatted message string with colors
 */
function formatMessage(
  level: LogLevel,
  namespace: string,
  message: string
): string {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}] [${namespace}]`;

  switch (level) {
    case "info":
      return `${colors.blue}${prefix}${colors.reset} ${message}`;

    case "success":
      return `${colors.green}✓ ${prefix}${colors.reset} ${message}`;

    case "warn":
      return `${colors.yellow}⚠ ${prefix}${colors.reset} ${message}`;

    case "error":
      return `${colors.red}✗ ${prefix}${colors.reset} ${message}`;

    case "debug":
      return `${colors.gray}${prefix}${colors.reset} ${colors.dim}${message}${colors.reset}`;

    default:
      return `${prefix} ${message}`;
  }
}

/**
 * Create a logger instance for a specific namespace
 *
 * @param namespace - The namespace for this logger (e.g., 'Main', 'BiasDetector', 'CLI')
 * @returns Logger instance with typed methods
 *
 * @example
 * const logger = createLogger('MyModule');
 * logger.info('Starting process...');
 * logger.success('Process completed!');
 * logger.warn('This might be an issue');
 * logger.error('Something went wrong', new Error('details'));
 */
export function createLogger(namespace: string): ILogger {
  return {
    /**
     * Log an informational message (blue)
     */
    info(message: string, ...args: any[]) {
      console.log(formatMessage("info", namespace, message), ...args);
    },

    /**
     * Log a success message (green with checkmark)
     */
    success(message: string, ...args: any[]) {
      console.log(formatMessage("success", namespace, message), ...args);
    },

    /**
     * Log a warning message (yellow with warning symbol)
     */
    warn(message: string, ...args: any[]) {
      console.warn(formatMessage("warn", namespace, message), ...args);
    },

    /**
     * Log an error message (red with X symbol)
     * Optionally include an Error object to print the stack trace
     */
    error(message: string, error?: Error) {
      console.error(formatMessage("error", namespace, message));
      if (error) {
        console.error(`${colors.dim}${error.stack}${colors.reset}`);
      }
    },

    /**
     * Log a debug message (gray/dimmed)
     * Useful for verbose logging during development
     */
    debug(message: string, ...args: any[]) {
      if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
        console.log(formatMessage("debug", namespace, message), ...args);
      }
    },
  };
}

/**
 * Export color constants for use in other modules
 */
export { colors };
