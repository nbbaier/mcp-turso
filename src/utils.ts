import type { Client } from "@libsql/client";
import { parseArgs } from "node:util";
import { z } from "zod";
import { DEFAULT_LOG_FILE } from "./logger.js";
import {
	envSchema,
	type Config,
	type TableColumn,
	type TextContent,
} from "./types.js";

export async function listTables(client: Client): Promise<string[]> {
	const result = await client.execute({
		sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
		args: [],
	});

	return result.rows.map((row) => row.name as string);
}

export async function dbSchema(client: Client): Promise<string[]> {
	const result = await client.execute({
		sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
		args: [],
	});

	return result.rows.map((row) => row.sql as string);
}

export async function describeTable(
	tableName: string,
	client: Client,
): Promise<TableColumn[]> {
	if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
		throw new Error(
			"Invalid table name. Only alphanumeric characters and underscores are allowed.",
		);
	}

	const result = await client.execute({
		sql: `PRAGMA table_info(${tableName})`,
		args: [],
	});

	if (result.rows.length === 0) {
		throw new Error(`Table '${tableName}' not found`);
	}

	return result.rows.map((row) => ({
		name: row.name as string,
		type: row.type as string,
		notnull: row.notnull as number,
		dflt_value: row.dflt_value as string | null,
		pk: row.pk as number,
	}));
}

export async function query<T = Record<string, unknown>>(
	sql: string,
	client: Client,
): Promise<{
	columns: string[];
	rows: T[];
	rowCount: number;
}> {
	const trimmedQuery = sql.trim().toUpperCase();
	if (!trimmedQuery.startsWith("SELECT")) {
		throw new Error("Only SELECT queries are allowed for safety reasons");
	}

	const result = await client.execute({
		sql,
		args: [],
	});

	return {
		columns: result.columns,
		rows: result.rows as T[],
		rowCount: result.rows.length,
	};
}

export function loadConfig(): Config {
	const config = envSchema.safeParse(process.env);

	if (!config.success) {
		throw new Error(`Configuration error: ${config.error.message}`);
	}

	return config.data;
}

export function content(
	text: string,
	error = false,
): { content: TextContent[]; isError: boolean } {
	return {
		content: [{ type: "text", text }],
		isError: error,
	};
}

/**
 * Determines the log file path based on command line arguments or defaults.
 *
 * @returns The path to the log file
 */
export function getLogFile(): string {
	const { values } = parseArgs({
		args: process.argv,
		options: {
			logs: {
				type: "string",
			},
		},
		strict: true,
		allowPositionals: true,
	});

	const parsedLogs = z
		.string()
		.refine((targetPath) => {
			const posixPath = targetPath.split("\\").join("/");
			return targetPath === posixPath && posixPath.includes("/");
		})
		.safeParse(values.logs);

	return values.logs && parsedLogs.success ? parsedLogs.data : DEFAULT_LOG_FILE;
}
