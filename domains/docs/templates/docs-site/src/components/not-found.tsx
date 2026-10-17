import { DocsLink } from "@voila.dev/ui-docs/components/docs-link";
import { DocsPage } from "@voila.dev/ui-docs/components/docs-page";
import { DocsPageHeader } from "@voila.dev/ui-docs/components/docs-page-header";

import { pageHref } from "../docs/vocabulary.ts";

/** What a path with no page shows: prerendered to `/404.html`, which the Worker answers with a 404. */
export function NotFound() {
	return (
		<DocsPage>
			<DocsPageHeader
				trail={[]}
				title="Page not found"
				description="This page does not exist, or it moved."
			/>
			<p className="text-docs-base">
				<DocsLink
					href={pageHref("index")}
					className="font-medium text-foreground underline underline-offset-4"
				>
					Back to the docs home
				</DocsLink>{" "}
				or search with <kbd>⌘K</kbd>.
			</p>
		</DocsPage>
	);
}
