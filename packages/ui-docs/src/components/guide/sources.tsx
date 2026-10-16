import { ArrowSquareOutIcon } from "@phosphor-icons/react";

import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";

/** The official pages an external procedure is checked against, and the day it last was. */
export function Sources() {
	const { messages } = useDocs();
	const { sources, lastVerified } = useDocsGuide();
	if (sources.length === 0) {
		return null;
	}
	return (
		<section className="mt-12 rounded-2xl border border-border px-5 py-4">
			<h2 className="font-semibold text-docs-sm text-foreground">
				{messages.guide.sourcesTitle}
			</h2>
			<ul className="mt-2 list-none space-y-1.5 p-0">
				{sources.map((source) => (
					<li key={source.href}>
						<DocsLink
							href={source.href}
							className="inline-flex items-center gap-1.5 text-docs-sm text-foreground/80 underline underline-offset-4 hover:text-foreground"
						>
							{source.label}
							<ArrowSquareOutIcon className="size-3.5 shrink-0" aria-hidden />
						</DocsLink>
					</li>
				))}
			</ul>
			{lastVerified ? (
				<p className="mt-3 text-muted-foreground text-xs">
					<time dateTime={lastVerified}>
						{messages.guide.lastVerified(lastVerified)}
					</time>
				</p>
			) : null}
		</section>
	);
}
