import type { DocHeading } from "@voila.dev/docs/heading";
import {
	type LazyContent,
	lazyContent,
} from "@voila.dev/ui-docs/lib/lazy-content";
import type { ComponentType } from "react";
import type { z } from "zod";

import { readmePages } from "./readme-pages.ts";
import {
	type docFrontmatterSchema,
	frontmatterOf,
	pageHref,
} from "./vocabulary.ts";

export type DocContentProps = {
	components?: Record<string, ComponentType<never>>;
};

/** A page compiled with `?meta`: its frontmatter and outline, without its body. */
interface DocMeta {
	frontmatter: unknown;
	headings: ReadonlyArray<DocHeading>;
}

export interface DocPage
	extends z.output<typeof docFrontmatterSchema>,
		LazyContent<DocContentProps> {
	/** Its path under `src/content/docs`, without `.mdx`. */
	slug: string;
	href: string;
	headings: ReadonlyArray<DocHeading>;
	/** The page's source, loaded on demand: only "Copy page" reads it. */
	loadSource: () => Promise<string>;
}

const CONTENT_DIRECTORY = "../content/docs/";

// Three views of the same files: the frontmatter and outline of every page in
// the first chunk, each body in a chunk of its own, and the source on demand.
const metas = import.meta.glob<DocMeta>("../content/docs/**/*.mdx", {
	query: "?meta",
	eager: true,
});
const bodies = import.meta.glob<ComponentType<DocContentProps>>(
	"../content/docs/**/*.mdx",
	{ import: "default" },
);
const sources = import.meta.glob<string>("../content/docs/**/*.mdx", {
	query: "?raw",
	import: "default",
});

function required<T>(loaders: Record<string, T>, path: string): T {
	const loader = loaders[path];
	if (!loader) {
		throw new Error(`${path} was not compiled`);
	}
	return loader;
}

function mdxPageOf([path, meta]: [string, DocMeta]): DocPage {
	const slug = path.slice(CONTENT_DIRECTORY.length).replace(/\.mdx$/u, "");
	return {
		...frontmatterOf(meta.frontmatter, `src/content/docs/${slug}.mdx`),
		slug,
		href: pageHref(slug),
		headings: meta.headings,
		...lazyContent(required(bodies, path)),
		loadSource: required(sources, path),
	};
}

/** Every page by slug: the MDX pages, and a page per package README. */
export const docPages: ReadonlyMap<string, DocPage> = new Map(
	[...Object.entries(metas).map(mdxPageOf), ...readmePages()].map((page) => [
		page.slug,
		page,
	]),
);

/** The page served at a path: `/guides` finds `guides.mdx` or `guides/index.mdx`. */
export function docPageAt(pathname: string): DocPage | undefined {
	const href = pathname.replace(/(.)\/+$/u, "$1");
	return [...docPages.values()].find((page) => page.href === href);
}

/** Loads the body of the page at a path, if any, so it renders without suspending. */
export async function preloadDocContentAt(pathname: string): Promise<void> {
	await docPageAt(pathname)?.preloadContent();
}
