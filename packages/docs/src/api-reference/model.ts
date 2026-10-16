import {
	type OpenApiDocument,
	type OpenApiOperation,
	type OpenApiSecurityScheme,
	openApiDocument,
	openApiOperation,
} from "./openapi-document.ts";
import { normalize, type SchemaNode, schemaContext } from "./schema-node.ts";

const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"head",
	"options",
	"trace",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface ApiParameter {
	name: string;
	location: "query" | "header" | "path" | "cookie";
	required: boolean;
	description?: string;
	schema: SchemaNode;
}

export interface ApiBody {
	contentType: string;
	schema: SchemaNode;
}

export interface ApiResponse {
	status: string;
	description: string;
	body?: ApiBody;
}

export interface ApiSecurityScheme extends OpenApiSecurityScheme {
	key: string;
}

export interface ApiOperation {
	operationId: string;
	slug: string;
	href: string;
	tag: { name: string; slug: string };
	method: HttpMethod;
	path: string;
	summary: string;
	description?: string;
	deprecated: boolean;
	parameters: ReadonlyArray<ApiParameter>;
	requestBody?: ApiBody;
	responses: ReadonlyArray<ApiResponse>;
	/** Any one of these schemes authorizes the call; empty when the operation is public. */
	security: ReadonlyArray<ApiSecurityScheme>;
}

export interface ApiTag {
	name: string;
	slug: string;
	description?: string;
	operations: ReadonlyArray<ApiOperation>;
}

export interface ApiReference {
	/** Where the reference is served: an operation lives at `<root>/<tag>/<operation>`. */
	root: string;
	title: string;
	version: string;
	description?: string;
	serverUrl: string;
	tags: ReadonlyArray<ApiTag>;
	operations: ReadonlyArray<ApiOperation>;
}

export interface ApiReferenceOptions {
	root: string;
	/** The tag of an operation the document files under none. */
	untaggedLabel: string;
	/** The base URL when the document declares no server. */
	fallbackServerUrl: string;
}

function slugify(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/gu, "")
		.replace(/([a-z0-9])([A-Z])/gu, "$1-$2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
}

/** Effect names an operation `<group>.<endpoint>`; the tag already says the group. */
function operationSlugOf(operationId: string): string {
	return slugify(operationId.split(".").at(-1) ?? operationId);
}

function bodyOf(
	content: OpenApiOperation["responses"][string]["content"],
	toNode: ToNode,
): ApiBody | undefined {
	const [entry] = Object.entries(content ?? {});
	if (!entry) {
		return undefined;
	}
	const [contentType, media] = entry;
	return { contentType, schema: toNode(media.schema) };
}

interface RawOperation {
	path: string;
	method: HttpMethod;
	operation: OpenApiOperation;
}

function rawOperationsOf(document: OpenApiDocument): Array<RawOperation> {
	return Object.entries(document.paths).flatMap(([path, item]) =>
		HTTP_METHODS.filter((method) => item[method] !== undefined).map(
			(method) => ({
				path,
				method,
				operation: openApiOperation.parse(item[method]),
			}),
		),
	);
}

function securityOf(
	requirements: OpenApiOperation["security"],
	schemes: Readonly<Record<string, OpenApiSecurityScheme>>,
): Array<ApiSecurityScheme> {
	return (requirements ?? []).flatMap((requirement) =>
		Object.keys(requirement).flatMap((key) => {
			const scheme = schemes[key];
			return scheme ? [{ ...scheme, key }] : [];
		}),
	);
}

type ToNode = (schema: Record<string, unknown>) => SchemaNode;

function parametersOf(
	operation: OpenApiOperation,
	toNode: ToNode,
): Array<ApiParameter> {
	return (operation.parameters ?? []).map((parameter) => ({
		name: parameter.name,
		location: parameter.in,
		required: parameter.required ?? parameter.in === "path",
		...(parameter.description ? { description: parameter.description } : {}),
		schema: toNode(parameter.schema ?? {}),
	}));
}

function responsesOf(
	operation: OpenApiOperation,
	toNode: ToNode,
): Array<ApiResponse> {
	return Object.entries(operation.responses).map(([status, response]) => {
		const body = bodyOf(response.content, toNode);
		return {
			status,
			description: response.description,
			...(body ? { body } : {}),
		};
	});
}

function tagOf(
	operation: OpenApiOperation,
	untaggedLabel: string,
): ApiOperation["tag"] {
	const name = operation.tags?.[0] ?? untaggedLabel;
	return { name, slug: slugify(name) };
}

function proseOf(
	operation: OpenApiOperation,
): Pick<ApiOperation, "summary" | "description" | "deprecated"> {
	return {
		summary: operation.summary ?? operation.operationId,
		...(operation.description ? { description: operation.description } : {}),
		deprecated: operation.deprecated ?? false,
	};
}

function operationOf(
	{ path, method, operation }: RawOperation,
	document: OpenApiDocument,
	options: ApiReferenceOptions,
): ApiOperation {
	const context = schemaContext(document.components?.schemas);
	function toNode(schema: Record<string, unknown>): SchemaNode {
		return normalize(schema, context);
	}
	const tag = tagOf(operation, options.untaggedLabel);
	const slug = operationSlugOf(operation.operationId);
	const requestBody = bodyOf(operation.requestBody?.content, toNode);
	return {
		operationId: operation.operationId,
		slug,
		href: `${options.root}/${tag.slug}/${slug}`,
		tag,
		method,
		path,
		...proseOf(operation),
		parameters: parametersOf(operation, toNode),
		...(requestBody ? { requestBody } : {}),
		responses: responsesOf(operation, toNode),
		security: securityOf(
			operation.security ?? document.security,
			document.components?.securitySchemes ?? {},
		),
	};
}

function tagsOf(
	document: OpenApiDocument,
	operations: ReadonlyArray<ApiOperation>,
): Array<ApiTag> {
	const declared = document.tags ?? [];
	const names = [
		...new Set([
			...declared.map((tag) => tag.name),
			...operations.map((operation) => operation.tag.name),
		]),
	];
	return names
		.map((name) => {
			const description = declared.find(
				(tag) => tag.name === name,
			)?.description;
			return {
				name,
				slug: slugify(name),
				...(description ? { description } : {}),
				operations: operations.filter(
					(operation) => operation.tag.name === name,
				),
			};
		})
		.filter((tag) => tag.operations.length > 0);
}

/** The API reference the docs render, from the OpenAPI document `OpenApi.fromApi` writes. */
export function toApiReference(
	input: unknown,
	options: ApiReferenceOptions,
): ApiReference {
	const document = openApiDocument.parse(input);
	const operations = rawOperationsOf(document).map((raw) =>
		operationOf(raw, document, options),
	);
	const tags = tagsOf(document, operations);
	return {
		root: options.root,
		title: document.info.title,
		version: document.info.version,
		...(document.info.description
			? { description: document.info.description }
			: {}),
		serverUrl: document.servers?.[0]?.url ?? options.fallbackServerUrl,
		tags,
		operations: tags.flatMap((tag) => tag.operations),
	};
}
