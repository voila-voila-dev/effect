import type {
	DocsPageGuide,
	DocsPageLink,
} from "@voila.dev/ui-docs/components/docs-guide";

import { type DocPage, docPages } from "./pages.ts";

function linkTo(slug: string): DocsPageLink {
	const page = docPages.get(slug);
	if (!page) {
		throw new Error(`a page links to "${slug}", which does not exist`);
	}
	return {
		title: page.title,
		href: page.href,
		description: page.description,
		...(page.icon ? { icon: page.icon } : {}),
	};
}

/**
 * What the frontmatter says around a page's content: what to read before it,
 * where to go next, and the sources it was checked against. A site with
 * reading paths (`@voila.dev/docs/paths`) or reader contexts adds them here.
 */
export function pageGuide(page: DocPage): DocsPageGuide {
	return {
		prerequisites: page.prerequisites.map(linkTo),
		next: page.next.map(linkTo),
		usedIn: [],
		variants: [],
		sources: page.sources,
		...(page.lastVerified ? { lastVerified: page.lastVerified } : {}),
	};
}
