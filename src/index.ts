#!/usr/bin/env node
import { type Client, createClient } from "@libsql/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import createLogger from "./logger.js";
import {
	content,
	dbSchema,
	describeTable,
	getLogFile,
	listTables,
	query,
} from "./utils.js";

const server = new McpServer({
	name: "Turso MCP Server",
	version: "0.1.0",
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

/**
 * MCP tool handler that lists all tables in the Turso database.
 */
server.tool("list_tables", "List all tables in the database", {}, async () => {
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
});

server.tool(
	"get_db_schema",
	"Get the schema for all tables in the database",
	{},
	async () => {
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
);

server.tool(
	"describe_table",
	"View schema information for a specific table",
	{
		table_name: z
			.string()
			.describe("Name of the table to describe")
			.min(1, "Table name is required"),
	},
	async ({ table_name }) => {
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
);

server.tool(
	"query",
	"Execute a SELECT query  to read data from the database",
	{
		sql: z
			.string()
			.describe("SELECT SQL query to execute")
			.min(1, "SQL query is required"),
	},
	async ({ sql }) => {
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
);

process.on("uncaughtException", (error) => {
	logger.error("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled rejection", reason);
});

console.error(`[INFO] Additional logs available at: ${logger.logFile}`);

logger.info("Connecting to transport...");
const transport = new StdioServerTransport();

await server.connect(transport);
logger.info("Turso MCP server running");

process.on("exit", (code) => {
	logger.info("Turso MCP server closed", code);
});
