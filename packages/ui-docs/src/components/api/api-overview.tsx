import { referenceMarkdown } from "@voila.dev/docs/api-reference/markdown";
import type { ApiReference } from "@voila.dev/docs/api-reference/model";
import type { ReactNode } from "react";

import { Chip, methodTone } from "../chip.tsx";
import { CodePanel, CodePre } from "../code-panel.tsx";
import { DocsFooter } from "../docs-footer.tsx";
import { DocsLink } from "../docs-link.tsx";
import { DocsPage } from "../docs-page.tsx";
import { DocsPageHeader } from "../docs-page-header.tsx";
import { useDocs } from "../docs-provider.tsx";
import { PageActions } from "../page-actions.tsx";

/** The API reference's landing page: the base URL and every endpoint, by tag. */
export function ApiOverviewPage({
	reference,
	description,
	url,
	meta,
}: {
	reference: ApiReference;
	description: string;
	/** The page's absolute URL, which the assistants are asked to read. */
	url: string;
	meta?: ReactNode;
}) {
	const { navigation, messages } = useDocs();
	const { location } = navigation;
	return (
		<DocsPage>
			<DocsPageHeader
				meta={meta}
				trail={location ? [location.group.label] : []}
				title={reference.title}
				description={description}
				actions={
					<PageActions
						source={async () =>
							referenceMarkdown(reference, { baseUrl: messages.api.baseUrl })
						}
						url={url}
					/>
				}
			/>
			<CodePanel
				tabs={[
					{
						label: messages.api.baseUrl,
						content: <CodePre>{reference.serverUrl}</CodePre>,
					},
				]}
			/>
			<p className="mt-3 text-docs-sm text-muted-foreground">
				{messages.api.version}{" "}
				<span className="font-mono">{reference.version}</span>
			</p>
			{reference.tags.map((tag) => (
				<section key={tag.slug} className="mt-12">
					<h2 className="font-heading font-semibold text-2xl text-foreground tracking-[-0.01em]">
						{tag.name}
					</h2>
					{tag.description ? (
						<p className="mt-2 text-foreground/75 leading-7">
							{tag.description}
						</p>
					) : null}
					<ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border">
						{tag.operations.map((operation) => (
							<li key={operation.href}>
								<DocsLink
									href={operation.href}
									className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]"
								>
									<Chip
										tone={methodTone(operation.method)}
										size="xs"
										className="w-9 justify-center"
									>
										{operation.method}
									</Chip>
									<span className="min-w-0 flex-1 font-medium text-foreground">
										{operation.summary}
									</span>
									<code className="hidden font-mono text-docs-sm text-muted-foreground sm:block">
										{operation.path}
									</code>
								</DocsLink>
							</li>
						))}
					</ul>
				</section>
			))}
			<DocsFooter />
		</DocsPage>
	);
}
