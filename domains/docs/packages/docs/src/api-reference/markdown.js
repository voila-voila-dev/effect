import { curlOf, exampleJson } from "./examples.ts";
const PARAMETER_LOCATIONS = [
    "path",
    "query",
    "header",
    "cookie",
];
function fence(language, code) {
    return `\`\`\`${language}\n${code}\n\`\`\``;
}
function parameterLine(parameter, required) {
    const marker = parameter.required ? ` (${required})` : "";
    const description = parameter.description
        ? ` : ${parameter.description}`
        : "";
    return `- \`${parameter.name}\`${marker}${description}`;
}
function parameterSections(operation, labels) {
    return PARAMETER_LOCATIONS.flatMap((location) => {
        const parameters = operation.parameters.filter((parameter) => parameter.location === location);
        return parameters.length > 0
            ? [
                `## ${labels.parameters[location]}`,
                parameters
                    .map((parameter) => parameterLine(parameter, labels.required))
                    .join("\n"),
            ]
            : [];
    });
}
/** An operation's page as Markdown: what the "copy page" action hands an assistant. */
export function operationMarkdown(operation, serverUrl, labels) {
    return [
        `# ${operation.summary}`,
        ...(operation.description ? [operation.description] : []),
        `\`${operation.method.toUpperCase()} ${serverUrl}${operation.path}\``,
        ...parameterSections(operation, labels),
        ...(operation.requestBody
            ? [
                `## ${labels.body}`,
                fence("json", exampleJson(operation.requestBody.schema)),
            ]
            : []),
        `## ${labels.requestExample}`,
        fence("bash", curlOf(operation, serverUrl)),
        ...operation.responses.flatMap((response) => [
            `## ${labels.responseExample} ${response.status}`,
            response.body
                ? fence("json", exampleJson(response.body.schema))
                : response.description,
        ]),
    ].join("\n\n");
}
/** The overview as Markdown: the base URL and every endpoint. */
export function referenceMarkdown(reference, labels) {
    return [
        `# ${reference.title}`,
        ...(reference.description ? [reference.description] : []),
        `${labels.baseUrl} : \`${reference.serverUrl}\``,
        ...reference.tags.flatMap((tag) => [
            `## ${tag.name}`,
            tag.operations
                .map((operation) => `- \`${operation.method.toUpperCase()} ${operation.path}\` : ${operation.summary}`)
                .join("\n"),
        ]),
    ].join("\n\n");
}
