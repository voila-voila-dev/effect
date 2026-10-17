import { resolveNavigation } from "@voila.dev/docs/navigation";

import { docsTabsConfig } from "../content/docs/sections.ts";
import { navigationOf, showcaseOf } from "./navigation.ts";
import { docPages } from "./pages.ts";
import { pageHref } from "./vocabulary.ts";

/** The sidebar registry, read off the sections and the pages' frontmatter. */
export const docsNavigation = navigationOf(docsTabsConfig, [
	...docPages.values(),
]);

/** The sidebar: the registry's slugs resolved to their pages. The kit has no HTTP API, so no API tab. */
export const docsTabs = resolveNavigation(docsNavigation, docPages, []);

/** The landing page's package grid. */
export const docsShowcase = showcaseOf(
	docsTabsConfig,
	docsNavigation,
	pageHref,
);
