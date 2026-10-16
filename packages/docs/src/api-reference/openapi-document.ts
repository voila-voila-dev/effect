import { z } from "zod";

/**
 * The part of an OpenAPI 3.1 document the API reference reads, parsed at the
 * boundary so a document the renderer does not understand fails the build
 * instead of rendering a half-empty page. JSON schemas stay opaque here:
 * `schema-node.ts` normalizes them.
 */

const jsonSchema = z.record(z.string(), z.unknown());

export type JsonSchema = z.infer<typeof jsonSchema>;

const mediaTypes = z.record(z.string(), z.object({ schema: jsonSchema }));

const parameter = z.object({
	name: z.string(),
	in: z.enum(["query", "header", "path", "cookie"]),
	required: z.boolean().optional(),
	description: z.string().optional(),
	schema: jsonSchema.optional(),
});

const securityRequirement = z.record(z.string(), z.array(z.string()));

export const openApiOperation = z.object({
	operationId: z.string(),
	tags: z.array(z.string()).optional(),
	summary: z.string().optional(),
	description: z.string().optional(),
	deprecated: z.boolean().optional(),
	parameters: z.array(parameter).optional(),
	requestBody: z
		.object({ content: mediaTypes, required: z.boolean().optional() })
		.optional(),
	responses: z.record(
		z.string(),
		z.object({ description: z.string(), content: mediaTypes.optional() }),
	),
	security: z.array(securityRequirement).optional(),
});

export type OpenApiOperation = z.infer<typeof openApiOperation>;

const securityScheme = z.object({
	type: z.string(),
	scheme: z.string().optional(),
	bearerFormat: z.string().optional(),
	name: z.string().optional(),
	in: z.string().optional(),
	description: z.string().optional(),
});

export type OpenApiSecurityScheme = z.infer<typeof securityScheme>;

export const openApiDocument = z.object({
	openapi: z.string().startsWith("3."),
	info: z.object({
		title: z.string(),
		version: z.string(),
		description: z.string().optional(),
	}),
	servers: z.array(z.object({ url: z.string() })).optional(),
	paths: z.record(z.string(), z.record(z.string(), z.unknown())),
	components: z
		.object({
			schemas: z.record(z.string(), jsonSchema).optional(),
			securitySchemes: z.record(z.string(), securityScheme).optional(),
		})
		.optional(),
	security: z.array(securityRequirement).optional(),
	tags: z
		.array(z.object({ name: z.string(), description: z.string().optional() }))
		.optional(),
});

export type OpenApiDocument = z.infer<typeof openApiDocument>;
