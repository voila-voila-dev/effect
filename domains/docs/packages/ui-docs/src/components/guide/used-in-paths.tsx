import { PathIcon } from "@phosphor-icons/react";

import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";

/** On a block, the paths that use it: the way back to a reader's journey from a page found by search. */
export function UsedInPaths() {
	const { messages } = useDocs();
	const { usedIn } = useDocsGuide();
	if (usedIn.length === 0) {
		return null;
	}
	return (
		<section className="mt-12">
			<h2 className="mb-3 font-semibold text-docs-sm text-foreground">
				{messages.guide.usedInPathsTitle}
			</h2>
			<ul className="m-0 list-none space-y-2 p-0">
				{usedIn.map((path) => (
					<li key={path.id}>
						<DocsLink
							href={path.href}
							className="inline-flex items-center gap-2 text-docs-sm text-foreground/80 hover:text-foreground"
						>
							<PathIcon className="size-4 shrink-0 opacity-70" aria-hidden />
							{path.title}
						</DocsLink>
					</li>
				))}
			</ul>
		</section>
	);
}
