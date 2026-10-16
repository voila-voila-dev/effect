import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";
import { Callout } from "../mdx/callout.tsx";

/** What the reader should have done before this page, from its frontmatter. */
export function Prerequisites() {
	const { messages } = useDocs();
	const { prerequisites } = useDocsGuide();
	if (prerequisites.length === 0) {
		return null;
	}
	return (
		<div className="mb-8">
			<Callout title={messages.guide.prerequisitesTitle}>
				<ul className="m-0 list-none space-y-1 p-0">
					{prerequisites.map((page) => (
						<li key={page.href}>
							<DocsLink
								href={page.href}
								className="font-medium text-foreground underline underline-offset-4"
							>
								{page.title}
							</DocsLink>
						</li>
					))}
				</ul>
			</Callout>
		</div>
	);
}
