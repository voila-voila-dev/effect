import {
	curlOf,
	exampleJson,
	exampleResponses,
	fetchOf,
} from "@voila.dev/docs/api-reference/examples";
import { operationMarkdown } from "@voila.dev/docs/api-reference/markdown";
import type {
	ApiOperation,
	ApiParameter,
	ApiResponse,
} from "@voila.dev/docs/api-reference/model";
import type { SchemaNode } from "@voila.dev/docs/api-reference/schema-node";
import type { ReactNode } from "react";
import { Chip, methodTone, statusTone } from "../chip.tsx";
import { CodePanel } from "../code-panel.tsx";
import { CopyButton } from "../copy-button.tsx";
import { DocsFooter } from "../docs-footer.tsx";
import { DocsPage } from "../docs-page.tsx";
import { DocsPageHeader } from "../docs-page-header.tsx";
import { useDocs } from "../docs-provider.tsx";
import { PageActions } from "../page-actions.tsx";
import { HighlightedCode } from "./highlighted-code.tsx";
import { SchemaFields } from "./schema-fields.tsx";

const PARAMETER_LOCATIONS: ReadonlyArray<ApiParameter["location"]> = [
	"path",
	"query",
	"header",
	"cookie",
];

function Section({
	title,
	aside,
	children,
}: {
	title: string;
	aside?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="mt-12">
			<div className="mb-6 flex items-baseline justify-between gap-3">
				<h2 className="font-heading font-semibold text-2xl text-foreground tracking-[-0.01em]">
					{title}
				</h2>
				{aside}
			</div>
			{children}
		</section>
	);
}

function ContentType({ value }: { value: string }) {
	return (
		<span className="font-mono text-muted-foreground text-xs">{value}</span>
	);
}

/** Parameters read as the fields of one object, so they list like a body. */
function parametersNode(parameters: ReadonlyArray<ApiParameter>): SchemaNode {
	return {
		kind: "object",
		nullable: false,
		properties: parameters.map((parameter) => ({
			name: parameter.name,
			required: parameter.required,
			schema: parameter.description
				? { ...parameter.schema, description: parameter.description }
				: parameter.schema,
		})),
	};
}

function ResponseItem({ response }: { response: ApiResponse }) {
	const { messages } = useDocs();
	return (
		<li className="py-6 first:pt-0 last:pb-0">
			<div className="flex flex-wrap items-center gap-2">
				<Chip tone={statusTone(response.status)}>{response.status}</Chip>
				<span className="text-foreground">
					{response.body ? response.description : messages.api.noContent}
				</span>
				{response.body ? (
					<span className="ml-auto">
						<ContentType value={response.body.contentType} />
					</span>
				) : null}
			</div>
			{response.body ? (
				<div className="mt-5 border-border border-l pl-5">
					<SchemaFields node={response.body.schema} />
				</div>
			) : null}
		</li>
	);
}

function Authorization({ operation }: { operation: ApiOperation }) {
	const { messages } = useDocs();
	return (
		<Section title={messages.api.authorization}>
			<ul className="space-y-2 text-foreground/75 leading-7">
				{operation.security.map((scheme) => (
					<li key={scheme.key}>
						<code className="font-medium font-mono text-foreground">
							{scheme.key}
						</code>{" "}
						{scheme.description ??
							(scheme.scheme === "bearer" ? messages.api.bearer : scheme.type)}
					</li>
				))}
			</ul>
		</Section>
	);
}

/** The request in cURL and JavaScript, then the body of each success and of each failure the contract gives an example of. */
function Examples({
	operation,
	serverUrl,
}: {
	operation: ApiOperation;
	serverUrl: string;
}) {
	const { messages } = useDocs();
	const responses = exampleResponses(operation);
	return (
		<div className="space-y-4">
			<CodePanel
				tabs={[
					{
						label: "cURL",
						content: (
							<HighlightedCode
								code={curlOf(operation, serverUrl)}
								language="shell"
							/>
						),
					},
					{
						label: "JavaScript",
						content: (
							<HighlightedCode
								code={fetchOf(operation, serverUrl)}
								language="javascript"
							/>
						),
					},
				]}
			/>
			{responses.length > 0 ? (
				<CodePanel
					tabs={responses.map((response) => ({
						label:
							responses.length > 1
								? `${messages.api.responseExample} ${response.status}`
								: messages.api.responseExample,
						content: (
							<HighlightedCode
								code={exampleJson(response.body.schema)}
								language="json"
							/>
						),
					}))}
				/>
			) : null}
		</div>
	);
}

function Endpoint({
	operation,
	serverUrl,
}: {
	operation: ApiOperation;
	serverUrl: string;
}) {
	const { messages } = useDocs();
	return (
		<div className="mt-6 flex items-center gap-3 rounded-xl border border-border p-2.5">
			<Chip tone={methodTone(operation.method)} size="md">
				{operation.method}
			</Chip>
			<code className="min-w-0 flex-1 truncate font-mono text-foreground">
				{operation.path}
			</code>
			{operation.deprecated ? (
				<Chip tone="orange">{messages.api.deprecated}</Chip>
			) : null}
			<CopyButton
				text={() => `${serverUrl}${operation.path}`}
				label={messages.api.copyUrl}
				copiedLabel={messages.api.copyUrlDone}
				className="size-7 justify-center rounded-lg hover:bg-foreground/5"
			/>
		</div>
	);
}

/** An operation's page: the endpoint, its parameters, body and responses, and the request examples beside them from xl up. */
export function ApiOperationPage({
	operation,
	serverUrl,
	url,
	meta,
}: {
	operation: ApiOperation;
	serverUrl: string;
	/** The page's absolute URL, which the assistants are asked to read. */
	url: string;
	meta?: ReactNode;
}) {
	const { messages } = useDocs();
	const examples = <Examples operation={operation} serverUrl={serverUrl} />;
	return (
		<DocsPage aside={examples} columns="examples">
			<DocsPageHeader
				meta={meta}
				trail={[operation.tag.name]}
				title={operation.summary}
				description={operation.description}
				actions={
					<PageActions
						source={async () =>
							operationMarkdown(operation, serverUrl, messages.api)
						}
						url={url}
					/>
				}
			>
				<Endpoint operation={operation} serverUrl={serverUrl} />
			</DocsPageHeader>

			<div className="xl:hidden">{examples}</div>

			{operation.security.length > 0 ? (
				<Authorization operation={operation} />
			) : null}

			{PARAMETER_LOCATIONS.map((where) => {
				const parameters = operation.parameters.filter(
					(parameter) => parameter.location === where,
				);
				return parameters.length > 0 ? (
					<Section key={where} title={messages.api.parameters[where]}>
						<SchemaFields node={parametersNode(parameters)} />
					</Section>
				) : null;
			})}

			{operation.requestBody ? (
				<Section
					title={messages.api.body}
					aside={<ContentType value={operation.requestBody.contentType} />}
				>
					<SchemaFields node={operation.requestBody.schema} />
				</Section>
			) : null}

			<Section title={messages.api.responses}>
				<ul className="divide-y divide-border">
					{operation.responses.map((response) => (
						<ResponseItem key={response.status} response={response} />
					))}
				</ul>
			</Section>

			<DocsFooter />
		</DocsPage>
	);
}
