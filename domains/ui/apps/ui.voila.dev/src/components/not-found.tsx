import { DocsLink } from "@voila.dev/ui-docs/components/docs-link";
import { DocsPage } from "@voila.dev/ui-docs/components/docs-page";
import { DocsPageHeader } from "@voila.dev/ui-docs/components/docs-page-header";

import { DocsLayout } from "./docs-layout.tsx";

/** What a path with no page shows: prerendered to `/404.html`, which the Worker answers with a 404. */
export function NotFound() {
	return (
		<DocsLayout>
			<DocsPage>
				<DocsPageHeader
					trail={[]}
					title="Page not found"
					description="That page does not exist — it may have been renamed while the API was still settling."
				/>
				<p className="text-docs-base">
					<DocsLink
						href="/start/introduction"
						className="font-medium text-foreground underline underline-offset-4"
					>
						Start from the introduction
					</DocsLink>{" "}
					or search with <kbd>⌘K</kbd>.
				</p>
			</DocsPage>
		</DocsLayout>
	);
}
