import { createClient } from "@libsql/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	content,
	dbSchema,
	describeTable,
	listTables,
	query,
} from "./utils.js";

const server = new McpServer({
	name: "Turso MCP Server",
	version: "0.1.0",
});

const db = createClient({
	url: process.env.TURSO_DATABASE_URL as string,
	authToken: process.env.TURSO_AUTH_TOKEN as string,
});

server.tool("list_tables", "List all tables in the database", {}, async () => {
	try {
		const tables = await listTables(db);
		return content(JSON.stringify({ tables }, null, 2));
	} catch (error) {
		return content(
			`Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
			true,
		);
	}
});

server.tool("get_schema", "Get the schema for all tables", {}, async () => {
	try {
		const schema = await dbSchema(db);
		return content(JSON.stringify({ schema }, null, 2));
	} catch (error) {
		return content(
			`Error getting schema: ${error instanceof Error ? error.message : String(error)}`,
			true,
		);
	}
});

server.tool(
	"describe_table",
	"Get the schema of a specific table",
	{
		table_name: z
			.string()
			.describe("Name of the table to describe")
			.min(1, "Table name is required"),
	},
	async ({ table_name }) => {
		try {
			const schema = await describeTable(table_name, db);
			return content(JSON.stringify({ schema }, null, 2));
		} catch (error) {
			return content(
				`Error describing table: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
);

server.tool(
	"query",
	"Run a SELECT query",
	{
		sql: z
			.string()
			.describe("SELECT SQL query to execute")
			.min(1, "SQL query is required"),
	},
	async ({ sql }) => {
		try {
			const result = await query(sql, db);
			return content(JSON.stringify(result, null, 2));
		} catch (error) {
			return content(
				`Error executing query: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
