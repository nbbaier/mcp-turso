import { FastMCP } from "fastmcp";
import { z } from "zod";
import createLogger from "./logger.js";
import {
	getLogFile,
	listTables,
	content,
	dbSchema,
	describeTable,
	query,
	getVersion,
} from "./utils.js";
import { createClient, type Client } from "@libsql/client";
import pkg from "../package.json" with { type: "json" };

const server = new FastMCP({
	name: "Turso MCP Server",
	version: getVersion(pkg),
});

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const logFile = getLogFile();

const logger = createLogger(logFile);

if (!dbUrl) {
	logger.error("TURSO_DATABASE_URL environment variable is required");
	process.exit(1);
}

if (!authToken) {
	logger.error("TURSO_AUTH_TOKEN environment variable is required");
	process.exit(1);
}

let db: Client;

try {
	db = createClient({ url: dbUrl, authToken });
	logger.info("Successfully connected to Turso database");
} catch (error) {
	logger.error("Failed to connect to Turso database", error);
	process.exit(1);
}

server.addTool({
	name: "list_tables",
	description: "List all tables in the database",
	parameters: z.object({}),
	execute: async () => {
		try {
			logger.info("Executing list_tables");
			const tables = await listTables(db);
			return content(JSON.stringify({ tables }, null, 2));
		} catch (error) {
			logger.error("Failed to list tables", error);
			return content(
				`Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
});

server.addTool({
	name: "get_db_schema",
	description: "Get the schema for all tables in the database",
	parameters: z.object({}),
	execute: async () => {
		try {
			const schema = await dbSchema(db);
			return content(JSON.stringify({ schema }, null, 2));
		} catch (error) {
			return content(
				`Error getting schema: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
});

server.addTool({
	name: "describe_table",
	description: "View schema information for a specific table",
	parameters: z.object({
		table_name: z
			.string()
			.describe("Name of the table to describe")
			.min(1, "Table name is required"),
	}),
	execute: async ({ table_name }) => {
		try {
			logger.info(`Executing describe_table for table: ${table_name}`);
			const schema = await describeTable(table_name, db);
			return content(JSON.stringify({ schema }, null, 2));
		} catch (error) {
			logger.error(`Failed to describe table ${table_name}`, error);
			return content(
				`Error describing table: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
});

server.addTool({
	name: "query_database",
	description: "Execute a SELECT query to read data from the database",
	parameters: z.object({
		sql: z
			.string()
			.describe("SQL query to execute")
			.min(1, "SQL query is required"),
	}),
	execute: async ({ sql }) => {
		try {
			logger.info(`Executing query: ${sql}`);
			const result = await query(sql, db);
			return content(JSON.stringify(result, null, 2));
		} catch (error) {
			logger.error("Failed to execute query", error);
			return content(
				`Error executing query: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
});

process.on("uncaughtException", (error) => {
	logger.error("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled rejection", reason);
});

console.error(`[INFO] Additional logs available at: ${logger.logFile}`);

server.start({
	transportType: "stdio",
});

process.on("exit", (code) => {
	logger.info("Turso MCP server closed", code);
});
