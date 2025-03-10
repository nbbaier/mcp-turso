import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import pkg from "../package.json" with { type: "json" };

export const DEFAULT_LOG_FILE = join(
	homedir(),
	`Library/Logs/MCP_Servers/${pkg.name}.log`,
);

function ensureLogFileExists(logFile: string = DEFAULT_LOG_FILE) {
	const logDir = dirname(logFile);
	if (!existsSync(logDir)) {
		mkdirSync(logDir, { recursive: true });
	}
	if (!existsSync(logFile)) {
		appendFileSync(logFile, "");
	}
}

function formatMessage(level: string, message: string, data?: unknown): string {
	const timestamp = new Date().toISOString();
	const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : "";
	return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
}

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
