import { PencilSimpleIcon } from "@phosphor-icons/react";
import { groupTrail } from "@voila.dev/docs/navigation";
import { DocsFooter } from "@voila.dev/ui-docs/components/docs-footer";
import { DocsGuideProvider } from "@voila.dev/ui-docs/components/docs-guide";
import { DocsPage } from "@voila.dev/ui-docs/components/docs-page";
import { DocsPageHeader } from "@voila.dev/ui-docs/components/docs-page-header";
import { useDocs } from "@voila.dev/ui-docs/components/docs-provider";
import { DocsToc } from "@voila.dev/ui-docs/components/docs-toc";
import { NextSteps } from "@voila.dev/ui-docs/components/guide/next-steps";
import { Prerequisites } from "@voila.dev/ui-docs/components/guide/prerequisites";
import { Sources } from "@voila.dev/ui-docs/components/guide/sources";
import { mdxComponents } from "@voila.dev/ui-docs/components/mdx/mdx-components";
import { PageActions } from "@voila.dev/ui-docs/components/page-actions";
import { Suspense } from "react";

import { docsConfig } from "../../docs.config.ts";
import { pageGuide } from "../docs/guide.ts";
import type { DocPage } from "../docs/pages.ts";

/** A page: its breadcrumb, title and "Copy page", its body and outline, and where to edit it. */
export function DocsArticle({ page }: { page: DocPage }) {
	const { location } = useDocs().navigation;
	const { Content } = page;
	return (
		<DocsGuideProvider guide={pageGuide(page)}>
			<DocsPage aside={<DocsToc headings={page.headings} />}>
				<DocsPageHeader
					trail={
						location
							? [
									location.tab.label,
									...groupTrail(location.tab, location.group),
								].filter(
									(label, index, labels) => labels.indexOf(label) === index,
								)
							: []
					}
					title={page.title}
					description={page.description}
					actions={
						<PageActions
							source={page.loadSource}
							url={new URL(`${page.href}/`, docsConfig.url).href}
						/>
					}
				/>
				<Prerequisites />
				<div className="docs-prose docs-flow">
					{/* Hydration keeps the prerendered body until its chunk arrives. */}
					<Suspense fallback={null}>
						<Content components={mdxComponents} />
					</Suspense>
				</div>
				<p className="mt-12">
					<a
						href={`${docsConfig.editBase}/${page.slug}.mdx`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-docs-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<PencilSimpleIcon aria-hidden />
						Edit this page on GitHub
					</a>
				</p>
				<Sources />
				<NextSteps />
				<DocsFooter />
			</DocsPage>
		</DocsGuideProvider>
	);
}
