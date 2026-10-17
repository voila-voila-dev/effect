import { useRouterState } from "@tanstack/react-router";
import { locate } from "@voila.dev/docs/navigation";
import type { DocsNavigationState } from "@voila.dev/ui-docs/components/docs-provider";

import { docsTabs } from "../docs/site.ts";

/** Where the reader is in the docs, read from the URL: what the header, sidebar, breadcrumb and footer show. */
export function useDocsNavigation(): DocsNavigationState {
	const pathname = useRouterState({
		select: (state) => state.location.pathname.replace(/(.)\/+$/u, "$1"),
	});
	const location = locate(docsTabs, pathname);
	return {
		pathname,
		tabs: docsTabs,
		activeTab: location?.tab ?? docsTabs[0],
		location,
	};
}
