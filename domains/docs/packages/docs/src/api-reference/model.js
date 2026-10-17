import { openApiDocument, openApiOperation, } from "./openapi-document.ts";
import { normalize, schemaContext } from "./schema-node.ts";
const HTTP_METHODS = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
    "trace",
];
function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/gu, "")
        .replace(/([a-z0-9])([A-Z])/gu, "$1-$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, "-")
        .replace(/^-+|-+$/gu, "");
}
/** Effect names an operation `<group>.<endpoint>`; the tag already says the group. */
function operationSlugOf(operationId) {
    return slugify(operationId.split(".").at(-1) ?? operationId);
}
function bodyOf(content, toNode) {
    const [entry] = Object.entries(content ?? {});
    if (!entry) {
        return undefined;
    }
    const [contentType, media] = entry;
    return { contentType, schema: toNode(media.schema) };
}
function rawOperationsOf(document) {
    return Object.entries(document.paths).flatMap(([path, item]) => HTTP_METHODS.filter((method) => item[method] !== undefined).map((method) => ({
        path,
        method,
        operation: openApiOperation.parse(item[method]),
    })));
}
function securityOf(requirements, schemes) {
    return (requirements ?? []).flatMap((requirement) => Object.keys(requirement).flatMap((key) => {
        const scheme = schemes[key];
        return scheme ? [{ ...scheme, key }] : [];
    }));
}
function parametersOf(operation, toNode) {
    return (operation.parameters ?? []).map((parameter) => ({
        name: parameter.name,
        location: parameter.in,
        required: parameter.required ?? parameter.in === "path",
        ...(parameter.description ? { description: parameter.description } : {}),
        schema: toNode(parameter.schema ?? {}),
    }));
}
function responsesOf(operation, toNode) {
    return Object.entries(operation.responses).map(([status, response]) => {
        const body = bodyOf(response.content, toNode);
        return {
            status,
            description: response.description,
            ...(body ? { body } : {}),
        };
    });
}
function tagOf(operation, untaggedLabel) {
    const name = operation.tags?.[0] ?? untaggedLabel;
    return { name, slug: slugify(name) };
}
function proseOf(operation) {
    return {
        summary: operation.summary ?? operation.operationId,
        ...(operation.description ? { description: operation.description } : {}),
        deprecated: operation.deprecated ?? false,
    };
}
function operationOf({ path, method, operation }, document, options) {
    const context = schemaContext(document.components?.schemas);
    function toNode(schema) {
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
        security: securityOf(operation.security ?? document.security, document.components?.securitySchemes ?? {}),
    };
}
function tagsOf(document, operations) {
    const declared = document.tags ?? [];
    const names = [
        ...new Set([
            ...declared.map((tag) => tag.name),
            ...operations.map((operation) => operation.tag.name),
        ]),
    ];
    return names
        .map((name) => {
        const description = declared.find((tag) => tag.name === name)?.description;
        return {
            name,
            slug: slugify(name),
            ...(description ? { description } : {}),
            operations: operations.filter((operation) => operation.tag.name === name),
        };
    })
        .filter((tag) => tag.operations.length > 0);
}
/** The API reference the docs render, from the OpenAPI document `OpenApi.fromApi` writes. */
export function toApiReference(input, options) {
    const document = openApiDocument.parse(input);
    const operations = rawOperationsOf(document).map((raw) => operationOf(raw, document, options));
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
