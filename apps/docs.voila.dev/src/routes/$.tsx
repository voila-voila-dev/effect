import { createFileRoute, notFound } from "@tanstack/react-router";

import { DocsArticle } from "../components/docs-article.tsx";
import { pageHead } from "../docs/head.ts";
import { docPageAt } from "../docs/pages.ts";

/** Every page but the home: `/guides/install` is `src/content/docs/guides/install.mdx`. */
export const Route = createFileRoute("/$")({
	loader: async ({ location }) => {
		const page = docPageAt(location.pathname);
		if (!page) {
			throw notFound();
		}
		// The body loads before the render, so a prerendered page hydrates without a flash.
		await page.preloadContent();
		return { href: page.href };
	},
	head: ({ loaderData }) => {
		const page = loaderData && docPageAt(loaderData.href);
		return page ? pageHead(page) : {};
	},
	component: DocsSplatPage,
});

function DocsSplatPage() {
	const page = docPageAt(Route.useLoaderData().href);
	return page ? <DocsArticle page={page} /> : null;
}
