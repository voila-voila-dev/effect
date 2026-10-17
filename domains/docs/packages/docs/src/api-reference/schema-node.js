const CONSTRAINT_KEYWORDS = [
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "minItems",
    "maxItems",
];
const REF_PREFIX = "#/components/schemas/";
const SCALAR_TYPES = new Set([
    "string",
    "number",
    "integer",
    "boolean",
    "null",
]);
// Effect encodes `Schema.Number` as a number or one of these strings, an
// artefact of JSON having no spelling for them that a reader does not need.
const NON_FINITE_SPELLINGS = ["Infinity", "-Infinity", "NaN"];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function schemasOf(value) {
    return Array.isArray(value) ? value.filter(isRecord) : [];
}
function baseOf(schema) {
    const [example] = Array.isArray(schema.examples) ? schema.examples : [];
    return {
        ...(typeof schema.description === "string"
            ? { description: schema.description }
            : {}),
        ...(isJson(example) ? { example } : {}),
        nullable: false,
    };
}
function displayName(componentName) {
    return componentName.replace(/Encoded$/u, "");
}
function isNull(node) {
    return node.kind === "scalar" && node.type === "null";
}
function isNonFiniteSpelling(node) {
    return (node.kind === "scalar" &&
        node.type === "string" &&
        node.enum?.length === NON_FINITE_SPELLINGS.length &&
        NON_FINITE_SPELLINGS.every((spelling) => node.enum?.includes(spelling)));
}
function unionOf(variants, base) {
    const nullable = variants.some(isNull);
    const meaningful = variants.filter((variant) => !(isNull(variant) || isNonFiniteSpelling(variant)));
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
function constraintsOf(schema) {
    return Object.fromEntries(CONSTRAINT_KEYWORDS.flatMap((keyword) => {
        const value = schema[keyword];
        return typeof value === "number" ? [[keyword, value]] : [];
    }));
}
function scalarTypeOf(schema) {
    const type = schema.type;
    if (typeof type === "string" && isScalarType(type)) {
        return type;
    }
    const [first] = Array.isArray(schema.enum) ? schema.enum : [schema.const];
    const inferred = first === null ? "null" : typeof first;
    return isScalarType(inferred) ? inferred : undefined;
}
function isScalarType(type) {
    return SCALAR_TYPES.has(type);
}
function isScalarValue(value) {
    return (value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean");
}
function isJson(value) {
    if (isScalarValue(value))
        return true;
    if (Array.isArray(value))
        return value.every(isJson);
    return (typeof value === "object" &&
        value !== null &&
        Object.values(value).every(isJson));
}
function enumOf(schema) {
    if (Array.isArray(schema.enum)) {
        return schema.enum.filter(isScalarValue);
    }
    return "const" in schema && isScalarValue(schema.const)
        ? [schema.const]
        : undefined;
}
function scalarOf(schema, type) {
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
function objectOf(schema, context) {
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
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
function referenceOf(reference, context) {
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
function mergedAllOf(parts, context) {
    const nodes = parts.map((part) => normalize(part, context));
    const properties = nodes.flatMap((node) => node.kind === "object" ? node.properties : []);
    const [first] = nodes;
    if (properties.length === 0 && first) {
        return first;
    }
    return { kind: "object", properties, nullable: false };
}
function typeListOf(schema, context) {
    const types = (Array.isArray(schema.type) ? schema.type : []).filter((type) => typeof type === "string");
    return unionOf(types.map((type) => normalize({ ...schema, type }, context)), baseOf(schema));
}
// The first rule that matches wins: a `$ref` or a union says more than the
// `type` beside it.
const NORMALIZE_RULES = [
    {
        matches: (schema) => typeof schema.$ref === "string",
        build: (schema, context) => referenceOf(String(schema.$ref), context),
    },
    {
        matches: (schema) => schemasOf(schema.anyOf ?? schema.oneOf).length > 0,
        build: (schema, context) => unionOf(schemasOf(schema.anyOf ?? schema.oneOf).map((variant) => normalize(variant, context)), baseOf(schema)),
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
        matches: (schema) => schema.type === "object" || isRecord(schema.properties),
        build: objectOf,
    },
    {
        matches: (schema) => scalarTypeOf(schema) !== undefined,
        build: (schema) => scalarOf(schema, scalarTypeOf(schema) ?? "string"),
    },
];
/** Resolves every `$ref` and folds the JSON-schema spellings of one idea (nullable, unions, allOf) into one node. */
export function normalize(schema, context) {
    const rule = NORMALIZE_RULES.find((candidate) => candidate.matches(schema));
    return rule
        ? rule.build(schema, context)
        : { ...baseOf(schema), kind: "any" };
}
export function schemaContext(components = {}) {
    return { components, resolving: new Set() };
}
/** A scalar's constraints in keyword order, each with its bound. */
export function constraintEntries(constraints) {
    return CONSTRAINT_KEYWORDS.flatMap((keyword) => {
        const value = constraints[keyword];
        return value === undefined ? [] : [[keyword, value]];
    });
}
