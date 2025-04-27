import type { Client } from "@libsql/client";
import { parseArgs } from "node:util";
import { z } from "zod";
import { DEFAULT_LOG_FILE } from "./logger.js";
import {
	type Config,
	type TableColumn,
	type TextContent,
	envSchema,
} from "./types.js";

/**
 * Retrieves a list of all tables in the Turso database.
 *
 * @param client - The Turso database client instance
 * @returns A promise that resolves to an array of table names
 */
export async function listTables(client: Client): Promise<string[]> {
	const result = await client.execute({
		sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
		args: [],
	});

	return result.rows.map((row) => row.name as string);
}

/**
 * Retrieves the SQL schema definitions for all tables in the database.
 *
 * @param client - The Turso database client instance
 * @returns A promise that resolves to an array of SQL schema statements
 */
export async function dbSchema(client: Client): Promise<string[]> {
	const result = await client.execute({
		sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
		args: [],
	});

	return result.rows.map((row) => row.sql as string);
}

/**
 * Retrieves detailed schema information for a specific table.
 *
 * @param tableName - The name of the table to describe
 * @param client - The Turso database client instance
 * @returns A promise that resolves to an array of column definitions
 * @throws Error if the table name is invalid or the table doesn't exist
 */
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

/**
 * Executes a SELECT SQL query against the database.
 *
 * @param sql - The SQL query to execute (must be a SELECT query)
 * @param client - The Turso database client instance
 * @returns A promise that resolves to an object containing columns, rows, and row count
 * @throws Error if the query is not a SELECT query
 */
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

/**
 * Loads and validates environment configuration for the Turso database.
 *
 * @returns A validated configuration object
 * @throws Error if the configuration is invalid
 */
export function loadConfig(): Config {
	const config = envSchema.safeParse(process.env);

	if (!config.success) {
		throw new Error(`Configuration error: ${config.error.message}`);
	}

	return config.data;
}

/**
 * Creates a formatted content response object for MCP tools.
 *
 * @param text - The text content to include in the response
 * @param error - Whether this content represents an error (default: false)
 * @returns A formatted content result object
 */
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

/**
 * Retrieves the version string from a package.json file.
 *
 * @param pkg - The package.json file content
 * @returns The version string
 */
export function getVersion(
	pkg: Record<string, unknown>,
): `${number}.${number}.${number}` {
	return (pkg.version as string).match(/^\d+\.\d+\.\d+$/)
		? (pkg.version as `${number}.${number}.${number}`)
		: "0.0.0";
}
