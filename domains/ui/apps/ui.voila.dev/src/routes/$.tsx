import { createFileRoute, notFound } from "@tanstack/react-router";

import { DocsArticle } from "../components/docs-article.tsx";
import { DocsLayout } from "../components/docs-layout.tsx";
import { pageHead } from "../docs/head.ts";
import { docPageAt } from "../docs/pages.ts";

/** Every page but the home: `/ui/button` is `src/content/docs/ui/button.mdx`. */
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
	return <DocsLayout>{page ? <DocsArticle page={page} /> : null}</DocsLayout>;
}
