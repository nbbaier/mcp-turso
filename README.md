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

### Logging

The server includes a custom logger for debugging outside of Claude Desktop. By default, this logger writes to `<parent-dir>/logs/mcp-turso.log`, where `<parent-dir>` is the parent directory of directory containing the `mcp-turso` script. In other words, if the path to `mcp-turso` is `~/foo/bin/mcp-turso`, the logs will be at `~/foo/logs/mcp-turso.log`. If running with NPX as above, the default logs will be:

```
~/.npm/_npx/<npx-dir-name>/node_modules/mcp-turso/logs/mcp-turso.log
```

If you would like to specify a custom path, you can include a `--logs` flag with an **absolute posix path** in the server's configuration:

```json
{
   "mcpServers": [
      "turso": {
         "command": "npx",
         "args": ["-y", "mcp-turso", "--logs", "/Users/<username>/path/to/dir/mcp-logs.log"],
         "env": {
            "TURSO_DATABASE_URL": "your_url",
            "TURSO_AUTH_TOKEN": "your_token"
         }
      }
   ]
}
```

The path to the log file (default or custom) is always logged to `stderr` when the server is created. For Claude desktop, this will show up in your server logs in `~/Library/Logs/Claude`. 

_Note_: Right now, I haven't implemented specifying a custom logging file for Windows, but this is coming. 

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

## Todo

- [ ] Add the ability to specify a custom log file on windows
- [ ] Add more query tools

## License

MIT License - see the [LICENSE](LICENSE) file for details.


