import { curlOf, exampleJson } from "./examples.ts";
import type { ApiOperation, ApiParameter, ApiReference } from "./model.ts";

/** The words the Markdown export writes, in the reader's language. */
export interface ApiMarkdownLabels {
	parameters: Readonly<Record<ApiParameter["location"], string>>;
	required: string;
	body: string;
	requestExample: string;
	responseExample: string;
	baseUrl: string;
}

const PARAMETER_LOCATIONS: ReadonlyArray<ApiParameter["location"]> = [
	"path",
	"query",
	"header",
	"cookie",
];

function fence(language: string, code: string): string {
	return `\`\`\`${language}\n${code}\n\`\`\``;
}

function parameterLine(parameter: ApiParameter, required: string): string {
	const marker = parameter.required ? ` (${required})` : "";
	const description = parameter.description
		? ` : ${parameter.description}`
		: "";
	return `- \`${parameter.name}\`${marker}${description}`;
}

function parameterSections(
	operation: ApiOperation,
	labels: ApiMarkdownLabels,
): Array<string> {
	return PARAMETER_LOCATIONS.flatMap((location) => {
		const parameters = operation.parameters.filter(
			(parameter) => parameter.location === location,
		);
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
export function operationMarkdown(
	operation: ApiOperation,
	serverUrl: string,
	labels: ApiMarkdownLabels,
): string {
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
export function referenceMarkdown(
	reference: ApiReference,
	labels: Pick<ApiMarkdownLabels, "baseUrl">,
): string {
	return [
		`# ${reference.title}`,
		...(reference.description ? [reference.description] : []),
		`${labels.baseUrl} : \`${reference.serverUrl}\``,
		...reference.tags.flatMap((tag) => [
			`## ${tag.name}`,
			tag.operations
				.map(
					(operation) =>
						`- \`${operation.method.toUpperCase()} ${operation.path}\` : ${operation.summary}`,
				)
				.join("\n"),
		]),
	].join("\n\n");
}
