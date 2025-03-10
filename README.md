# mcp-turso

A Model Context Protocol (MCP) server that provides access to the Turso-hosted LibSQL databases. Currently, the server provides the following functionality:

-  Retrieving a list of tables in a database
-  Retrieview the database schema
-  Retrieving the schema of a table
-  Performing SELECT queries

## Configuration

### With Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
   "mcpServers": [
      "turso": {
         "command": "npx",
         "args": ["-y", "mcp-turso"],
         "env": {
            "TURSO_DATABASE_URL": "your_url",
            "TURSO_AUTH_TOKEN": "your_token"
         }
      }
   ]
}
```

You will need an existing database to continue. If you don’t have one, [create one](https://docs.turso.tech/quickstart). To get the database URL via the Turso CLI, run:

```bash
turso db show --url <database-name>
```

Then get the database authentication token:

```bash
turso db tokens create <database-name>
```

Add those values to your configuration as shown above.

## Server Capabilities

The server provides the following tools:

-  `list_tables`
   -  Get a list of all the tables in the database
   -  No input
   -  Returns: an array of table names
-  `get_db_schema`
   -  Get the schemas of all tables in the database
   -  No input
   -  Returns: an array of SQL creation statements
-  `describe_table`

   -  View schema information for a specific table

   -  Input: - `table_name` (string): Name of table to describe
   -  Returns: Array of column definitions with names and types

-  `query`
   -  Execute a SELECT query to read data from the database
   -  Input:
      -  `query` (string): The SELECT SQL query to execute
   -  Returns: Query results as an object of type `{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number; }`

## License

MIT License - see the [LICENSE](LICENSE) file for details.
