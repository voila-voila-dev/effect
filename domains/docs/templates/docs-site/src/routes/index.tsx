import { createFileRoute, notFound } from "@tanstack/react-router";

import { DocsArticle } from "../components/docs-article.tsx";
import { pageHead } from "../docs/head.ts";
import { docPageAt } from "../docs/pages.ts";
import { pageHref } from "../docs/vocabulary.ts";

/** The docs home, `src/content/docs/index.mdx`. */
export const Route = createFileRoute("/")({
	loader: async () => {
		const page = docPageAt(pageHref("index"));
		if (!page) {
			throw notFound();
		}
		await page.preloadContent();
		return { href: page.href };
	},
	head: ({ loaderData }) => {
		const page = loaderData && docPageAt(loaderData.href);
		return page ? pageHead(page) : {};
	},
	component: DocsHomePage,
});

function DocsHomePage() {
	const page = docPageAt(Route.useLoaderData().href);
	return page ? <DocsArticle page={page} /> : null;
}
