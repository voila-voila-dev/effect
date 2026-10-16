import type { JsonSchema } from "./openapi-document.ts";

export type ScalarType = "string" | "number" | "integer" | "boolean" | "null";

export type ScalarValue = string | number | boolean | null;

export type Json = ScalarValue | Array<Json> | { [key: string]: Json };

const CONSTRAINT_KEYWORDS = [
	"minLength",
	"maxLength",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"minItems",
	"maxItems",
] as const;

export type ConstraintKeyword = (typeof CONSTRAINT_KEYWORDS)[number];

interface SchemaNodeBase {
	/** The component the node was resolved from, without Effect's `Encoded` suffix. */
	name?: string;
	description?: string;
	/** The first of the schema's `examples`: a value the contract's author wrote, preferred to one derived from the shape. */
	example?: Json;
	nullable: boolean;
}

export interface SchemaProperty {
	name: string;
	required: boolean;
	schema: SchemaNode;
}

export type SchemaNode = SchemaNodeBase &
	(
		| {
				kind: "object";
				properties: ReadonlyArray<SchemaProperty>;
				additionalProperties?: SchemaNode;
		  }
		| { kind: "array"; items: SchemaNode }
		| { kind: "union"; variants: ReadonlyArray<SchemaNode> }
		| {
				kind: "scalar";
				type: ScalarType;
				enum?: ReadonlyArray<ScalarValue>;
				format?: string;
				pattern?: string;
				constraints: Partial<Record<ConstraintKeyword, number>>;
		  }
		/** A component that contains itself, shown by name instead of expanded forever. */
		| { kind: "recursive" }
		| { kind: "any" }
	);

const REF_PREFIX = "#/components/schemas/";

const SCALAR_TYPES: ReadonlySet<string> = new Set([
	"string",
	"number",
	"integer",
	"boolean",
	"null",
]);

// Effect encodes `Schema.Number` as a number or one of these strings, an
// artefact of JSON having no spelling for them that a reader does not need.
const NON_FINITE_SPELLINGS = ["Infinity", "-Infinity", "NaN"];

interface Context {
	components: Readonly<Record<string, JsonSchema>>;
	resolving: ReadonlySet<string>;
}

function isRecord(value: unknown): value is JsonSchema {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemasOf(value: unknown): Array<JsonSchema> {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

function baseOf(schema: JsonSchema): SchemaNodeBase {
	const [example] = Array.isArray(schema.examples) ? schema.examples : [];
	return {
		...(typeof schema.description === "string"
			? { description: schema.description }
			: {}),
		...(isJson(example) ? { example } : {}),
		nullable: false,
	};
}

function displayName(componentName: string): string {
	return componentName.replace(/Encoded$/u, "");
}

function isNull(node: SchemaNode): boolean {
	return node.kind === "scalar" && node.type === "null";
}

function isNonFiniteSpelling(node: SchemaNode): boolean {
	return (
		node.kind === "scalar" &&
		node.type === "string" &&
		node.enum?.length === NON_FINITE_SPELLINGS.length &&
		NON_FINITE_SPELLINGS.every((spelling) => node.enum?.includes(spelling))
	);
}

function unionOf(
	variants: ReadonlyArray<SchemaNode>,
	base: SchemaNodeBase,
): SchemaNode {
	const nullable = variants.some(isNull);
	const meaningful = variants.filter(
		(variant) => !(isNull(variant) || isNonFiniteSpelling(variant)),
	);
	const [only] = meaningful;
	if (meaningful.length === 1 && only) {
		return {
			...only,
			...base,
			nullable: nullable || only.nullable,
		};
	}
	return { ...base, kind: "union", variants: meaningful, nullable };
}

function constraintsOf(
	schema: JsonSchema,
): Partial<Record<ConstraintKeyword, number>> {
	return Object.fromEntries(
		CONSTRAINT_KEYWORDS.flatMap((keyword) => {
			const value = schema[keyword];
			return typeof value === "number" ? [[keyword, value]] : [];
		}),
	);
}

function scalarTypeOf(schema: JsonSchema): ScalarType | undefined {
	const type = schema.type;
	if (typeof type === "string" && isScalarType(type)) {
		return type;
	}
	const [first] = Array.isArray(schema.enum) ? schema.enum : [schema.const];
	const inferred = first === null ? "null" : typeof first;
	return isScalarType(inferred) ? inferred : undefined;
}

function isScalarType(type: string): type is ScalarType {
	return SCALAR_TYPES.has(type);
}

function isScalarValue(value: unknown): value is ScalarValue {
	return (
		value === null ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	);
}

function isJson(value: unknown): value is Json {
	if (isScalarValue(value)) return true;
	if (Array.isArray(value)) return value.every(isJson);
	return (
		typeof value === "object" &&
		value !== null &&
		Object.values(value).every(isJson)
	);
}

function enumOf(schema: JsonSchema): ReadonlyArray<ScalarValue> | undefined {
	if (Array.isArray(schema.enum)) {
		return schema.enum.filter(isScalarValue);
	}
	return "const" in schema && isScalarValue(schema.const)
		? [schema.const]
		: undefined;
}

function scalarOf(schema: JsonSchema, type: ScalarType): SchemaNode {
	const values = enumOf(schema);
	return {
		...baseOf(schema),
		kind: "scalar",
		type,
		...(values ? { enum: values } : {}),
		...(typeof schema.format === "string" ? { format: schema.format } : {}),
		...(typeof schema.pattern === "string" ? { pattern: schema.pattern } : {}),
		constraints: constraintsOf(schema),
	};
}

function objectOf(schema: JsonSchema, context: Context): SchemaNode {
	const properties = isRecord(schema.properties) ? schema.properties : {};
	const required = new Set(
		Array.isArray(schema.required) ? schema.required : [],
	);
	const additional = schema.additionalProperties;
	return {
		...baseOf(schema),
		kind: "object",
		properties: Object.entries(properties).map(([name, property]) => ({
			name,
			required: required.has(name),
			schema: normalize(isRecord(property) ? property : {}, context),
		})),
		...(isRecord(additional)
			? { additionalProperties: normalize(additional, context) }
			: {}),
	};
}

function referenceOf(reference: string, context: Context): SchemaNode {
	const componentName = reference.slice(REF_PREFIX.length);
	const name = displayName(componentName);
	if (context.resolving.has(componentName)) {
		return { kind: "recursive", name, nullable: false };
	}
	const component = context.components[componentName];
	if (!(reference.startsWith(REF_PREFIX) && component)) {
		throw new Error(`Unresolvable $ref ${reference}`);
	}
	return {
		...normalize(component, {
			...context,
			resolving: new Set([...context.resolving, componentName]),
		}),
		name,
	};
}

function mergedAllOf(parts: Array<JsonSchema>, context: Context): SchemaNode {
	const nodes = parts.map((part) => normalize(part, context));
	const properties = nodes.flatMap((node) =>
		node.kind === "object" ? node.properties : [],
	);
	const [first] = nodes;
	if (properties.length === 0 && first) {
		return first;
	}
	return { kind: "object", properties, nullable: false };
}

function typeListOf(schema: JsonSchema, context: Context): SchemaNode {
	const types = (Array.isArray(schema.type) ? schema.type : []).filter(
		(type): type is string => typeof type === "string",
	);
	return unionOf(
		types.map((type) => normalize({ ...schema, type }, context)),
		baseOf(schema),
	);
}

interface NormalizeRule {
	matches: (schema: JsonSchema) => boolean;
	build: (schema: JsonSchema, context: Context) => SchemaNode;
}

// The first rule that matches wins: a `$ref` or a union says more than the
// `type` beside it.
const NORMALIZE_RULES: ReadonlyArray<NormalizeRule> = [
	{
		matches: (schema) => typeof schema.$ref === "string",
		build: (schema, context) => referenceOf(String(schema.$ref), context),
	},
	{
		matches: (schema) => schemasOf(schema.anyOf ?? schema.oneOf).length > 0,
		build: (schema, context) =>
			unionOf(
				schemasOf(schema.anyOf ?? schema.oneOf).map((variant) =>
					normalize(variant, context),
				),
				baseOf(schema),
			),
	},
	{
		matches: (schema) => schemasOf(schema.allOf).length > 0,
		build: (schema, context) => mergedAllOf(schemasOf(schema.allOf), context),
	},
	{
		matches: (schema) => Array.isArray(schema.type),
		build: typeListOf,
	},
	{
		matches: (schema) => schema.type === "array",
		build: (schema, context) => ({
			...baseOf(schema),
			kind: "array",
			items: normalize(isRecord(schema.items) ? schema.items : {}, context),
		}),
	},
	{
		matches: (schema) =>
			schema.type === "object" || isRecord(schema.properties),
		build: objectOf,
	},
	{
		matches: (schema) => scalarTypeOf(schema) !== undefined,
		build: (schema) => scalarOf(schema, scalarTypeOf(schema) ?? "string"),
	},
];

/** Resolves every `$ref` and folds the JSON-schema spellings of one idea (nullable, unions, allOf) into one node. */
export function normalize(schema: JsonSchema, context: Context): SchemaNode {
	const rule = NORMALIZE_RULES.find((candidate) => candidate.matches(schema));
	return rule
		? rule.build(schema, context)
		: { ...baseOf(schema), kind: "any" };
}

export function schemaContext(
	components: Readonly<Record<string, JsonSchema>> = {},
): Context {
	return { components, resolving: new Set() };
}

/** A scalar's constraints in keyword order, each with its bound. */
export function constraintEntries(
	constraints: Partial<Record<ConstraintKeyword, number>>,
): ReadonlyArray<readonly [ConstraintKeyword, number]> {
	return CONSTRAINT_KEYWORDS.flatMap((keyword) => {
		const value = constraints[keyword];
		return value === undefined ? [] : [[keyword, value] as const];
	});
}
