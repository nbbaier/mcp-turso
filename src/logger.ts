import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = join(__dirname, "..");
const logsDir = join(parentDir, "logs");

export const DEFAULT_LOG_FILE = join(logsDir, `${pkg.name}.log`);

/**
 * Ensures that the log file and its directory exist, creating them if necessary.
 *
 * @param logFile - Path to the log file (defaults to DEFAULT_LOG_FILE)
 */
function ensureLogFileExists(logFile: string = DEFAULT_LOG_FILE) {
	const logDir = dirname(logFile);
	if (!existsSync(logDir)) {
		mkdirSync(logDir, { recursive: true });
	}
	if (!existsSync(logFile)) {
		appendFileSync(logFile, "");
	}
}

/**
 * Formats a log message with timestamp, level, and optional data.
 *
 * @param level - The log level (INFO, ERROR, DEBUG)
 * @param message - The log message text
 * @param data - Optional data to include in the log entry
 * @returns A formatted log string
 */
function formatMessage(level: string, message: string, data?: unknown): string {
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
export function createLogger(logFile: string = DEFAULT_LOG_FILE) {
	ensureLogFileExists(logFile);

	return {
		logFile,
		info(message: string, data?: unknown) {
			const logMessage = formatMessage("INFO", message, data);
			appendFileSync(logFile, logMessage);
		},

		error(message: string, error?: unknown) {
			const logMessage = formatMessage("ERROR", message, error);
			appendFileSync(logFile, logMessage);
		},

		debug(message: string, data?: unknown) {
			const logMessage = formatMessage("DEBUG", message, data);
			appendFileSync(logFile, logMessage);
		},
	};
}

export default createLogger;
