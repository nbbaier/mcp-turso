import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { name } from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = join(__dirname, "..");
const logsDir = join(parentDir, "logs");

export const DEFAULT_LOG_FILE = join(logsDir, `${name}.log`);

/**
 * Formats a log message with timestamp, level, and optional data.
 *
 * @param level - The log level (INFO, ERROR, DEBUG, etc)
 * @param message - The log message text
 * @param data - Optional data to include in the log entry
 * @returns A formatted log string
 */
function formatLogMessage(
	level: string,
	message: string,
	data?: unknown,
): string {
	const timestamp = new Date().toISOString();
	const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : "";
	return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
}

/**
 * Creates a logger instance that writes to the specified log file.
 *
 * @param logFile - Path to the log file (defaults to DEFAULT_LOG_FILE)
 * @returns A logger object with info, error, and debug methods
 */
/**
 * Creates a logger instance that writes log messages to a file.
 *
 * @param logFile - The path to the log file. Defaults to DEFAULT_LOG_FILE.
 * @returns A `logger` object with methods for logging at different levels.
 * @returns {Object} `logger` - The logger object.
 * @returns {string} `logger.logFile` - The path to the log file.
 * @returns {function} `logger.log` - Logs a message with a custom level.
 * @returns {function} `logger.info` - Logs an info level message.
 * @returns {function} `logger.error` - Logs an error level message.
 * @returns {function} `logger.debug` - Logs a debug level message.
 */
export function createLogger(logFile: string = DEFAULT_LOG_FILE) {
	const logDir = dirname(logFile);
	if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
	if (!existsSync(logFile)) appendFileSync(logFile, "");

	return {
		logFile,
		log(level: string, message: string, data?: unknown): void {
			const logMessage = formatLogMessage(level, message, data);
			appendFileSync(logFile, logMessage);
		},
		info(message: string, data?: unknown): void {
			const logMessage = formatLogMessage("INFO", message, data);
			appendFileSync(logFile, logMessage);
		},
		error(message: string, error?: unknown): void {
			const logMessage = formatLogMessage("ERROR", message, error);
			appendFileSync(logFile, logMessage);
		},
		debug(message: string, data?: unknown): void {
			const logMessage = formatLogMessage("DEBUG", message, data);
			appendFileSync(logFile, logMessage);
		},
	};
}

export default createLogger;
