import type { ApiOperation, ApiResponse } from "./model.ts";
import type {
	Json,
	ScalarType,
	ScalarValue,
	SchemaNode,
} from "./schema-node.ts";

const UUID_PATTERN = /\[0-9a-f\]\{8\}/u;

const FORMAT_EXAMPLES: Readonly<Record<string, string>> = {
	"date-time": "2026-10-03T09:00:00.000Z",
	date: "2026-10-03",
	email: "contact@example.com",
	uri: "https://example.com",
	uuid: "3f6c2b1e-8a4d-4c2f-9b7e-1d5a6e8f0c21",
};

function stringExample(node: Extract<SchemaNode, { kind: "scalar" }>): string {
	const byFormat = node.format ? FORMAT_EXAMPLES[node.format] : undefined;
	if (byFormat) {
		return byFormat;
	}
	return node.pattern && UUID_PATTERN.test(node.pattern)
		? (FORMAT_EXAMPLES.uuid ?? "")
		: "string";
}

const SCALAR_EXAMPLES: Readonly<
	Record<
		ScalarType,
		(node: Extract<SchemaNode, { kind: "scalar" }>) => ScalarValue
	>
> = {
	string: stringExample,
	number: (node) => node.constraints.minimum ?? 0,
	integer: (node) => node.constraints.minimum ?? 0,
	boolean: () => true,
	null: () => null,
};

const EXAMPLES: {
	[Kind in SchemaNode["kind"]]: (
		node: Extract<SchemaNode, { kind: Kind }>,
	) => Json;
} = {
	object: (node) =>
		Object.fromEntries([
			...node.properties.map((property) => [
				property.name,
				exampleOf(property.schema),
			]),
			...(node.additionalProperties
				? [["key", exampleOf(node.additionalProperties)]]
				: []),
		]),
	array: (node) => [exampleOf(node.items)],
	union: (node) => (node.variants[0] ? exampleOf(node.variants[0]) : null),
	scalar: (node) => node.enum?.[0] ?? SCALAR_EXAMPLES[node.type](node),
	recursive: () => ({}),
	any: () => null,
};

/** The schema's own example, or a plausible value: every property, the first enum value or union variant. */
export function exampleOf(node: SchemaNode): Json {
	if (node.example !== undefined) {
		return node.example;
	}
	return exampleOfKind(node.kind, node);
}

/** The table is keyed by the node's own kind; the generic kind pairs the two. */
function exampleOfKind<Kind extends SchemaNode["kind"]>(
	kind: Kind,
	node: Extract<SchemaNode, { kind: Kind }>,
): Json {
	return EXAMPLES[kind](node);
}

/** The responses an example is shown for: every success with a body, and any other the contract gives an example of. */
export function exampleResponses(
	operation: ApiOperation,
): Array<ApiResponse & { body: NonNullable<ApiResponse["body"]> }> {
	return operation.responses.flatMap((response) =>
		response.body &&
		(response.status.startsWith("2") ||
			response.body.schema.example !== undefined)
			? [{ ...response, body: response.body }]
			: [],
	);
}

export function exampleJson(node: SchemaNode): string {
	return JSON.stringify(exampleOf(node), null, 2);
}

function shellQuoted(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`;
}

/** The URL to call, with a placeholder for every required path and query parameter. */
function requestUrl(operation: ApiOperation, serverUrl: string): string {
	const path = operation.path.replace(/\{([^}]+)\}/gu, "<$1>");
	const query = operation.parameters
		.filter((parameter) => parameter.location === "query" && parameter.required)
		.map((parameter) => `${parameter.name}=<${parameter.name}>`)
		.join("&");
	return `${serverUrl}${path}${query ? `?${query}` : ""}`;
}

function requestHeaders(operation: ApiOperation): Array<[string, string]> {
	return [
		...operation.security
			.filter((scheme) => scheme.type === "http" && scheme.scheme === "bearer")
			.slice(0, 1)
			.map((): [string, string] => ["Authorization", "Bearer <token>"]),
		...operation.parameters
			.filter((parameter) => parameter.location === "header")
			.map((parameter): [string, string] => [
				parameter.name,
				`<${parameter.name}>`,
			]),
		...(operation.requestBody
			? [header("Content-Type", operation.requestBody.contentType)]
			: []),
	];
}

function header(name: string, value: string): [string, string] {
	return [name, value];
}

/** The cURL call of the operation. */
export function curlOf(operation: ApiOperation, serverUrl: string): string {
	const lines = [
		`curl --request ${operation.method.toUpperCase()}`,
		`  --url ${shellQuoted(requestUrl(operation, serverUrl))}`,
		...requestHeaders(operation).map(
			([name, value]) => `  --header ${shellQuoted(`${name}: ${value}`)}`,
		),
		...(operation.requestBody
			? [`  --data ${shellQuoted(exampleJson(operation.requestBody.schema))}`]
			: []),
	];
	return lines.join(" \\\n");
}

function objectKey(name: string): string {
	return /^[A-Za-z_$][\w$]*$/u.test(name) ? name : JSON.stringify(name);
}

/** The same call with `fetch`, as a browser or Node 18+ runs it. */
export function fetchOf(operation: ApiOperation, serverUrl: string): string {
	const headers = requestHeaders(operation);
	const options = [
		...(operation.method === "get"
			? []
			: [`  method: ${JSON.stringify(operation.method.toUpperCase())},`]),
		...(headers.length > 0
			? [
					"  headers: {",
					...headers.map(
						([name, value]) =>
							`    ${objectKey(name)}: ${JSON.stringify(value)},`,
					),
					"  },",
				]
			: []),
		...(operation.requestBody
			? [
					`  body: JSON.stringify(${exampleJson(operation.requestBody.schema).replaceAll("\n", "\n  ")}),`,
				]
			: []),
	];
	const url = JSON.stringify(requestUrl(operation, serverUrl));
	const call =
		options.length > 0
			? `fetch(${url}, {\n${options.join("\n")}\n})`
			: `fetch(${url})`;
	return `const response = await ${call};\nconst data = await response.json();`;
}
