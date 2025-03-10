import { z } from "zod";

export const TableColumnSchema = z.object({
	name: z.string(),
	type: z.string(),
	notnull: z.number(),
	dflt_value: z.union([z.string(), z.null()]),
	pk: z.number(),
});

export type TableColumn = z.infer<typeof TableColumnSchema>;

export const envSchema = z.object({
	TURSO_DATABASE_URL: z.string().min(1, "Database URL is required"),
	TURSO_AUTH_TOKEN: z.string().min(1, "Auth token is required"),
});

export type Config = z.infer<typeof envSchema>;

export type TextContent = {
	type: "text";
	text: string;
};

export type ImageContent = {
	type: "image";
	data: string;
	mimeType: string;
};

export type Content = TextContent | ImageContent;

export type ContentResult = {
	content: Content[];
	isError?: boolean;
};
