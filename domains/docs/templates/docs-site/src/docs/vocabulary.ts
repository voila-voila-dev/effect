import { docFrontmatter } from "@voila.dev/docs/page";
import { docHref } from "@voila.dev/docs/slug";
import { z } from "zod";

import { docsConfig } from "../../docs.config.ts";

type IconName = keyof typeof docsConfig.icons;

function iconNames(): readonly [IconName, ...Array<IconName>] {
	const [first, ...rest] = Object.keys(docsConfig.icons) as Array<IconName>;
	if (!first) {
		throw new Error("docs.config.ts declares no icon");
	}
	return [first, ...rest];
}

/** What every page's frontmatter may say, in the words `docs.config.ts` declares. */
export const docFrontmatterSchema = docFrontmatter({
	icons: iconNames(),
	audiences: docsConfig.vocabulary.audiences,
	stages: docsConfig.vocabulary.stages,
});

/** A page's validated frontmatter: a typo in it fails the build with the file's name. */
export function frontmatterOf(frontmatter: unknown, file: string) {
	const parsed = docFrontmatterSchema.safeParse(frontmatter);
	if (!parsed.success) {
		throw new Error(
			`Invalid frontmatter in ${file}:\n${z.prettifyError(parsed.error)}`,
		);
	}
	return parsed.data;
}

/** The docs home: the one page nothing needs to link to. */
export const DOCS_HOME_SLUG = "index";

/** Where a page is served: `guides/index` under `/` is `/guides`, `index` is `/`. */
export function pageHref(slug: string): string {
	const root = docsConfig.docsRoot.replace(/\/+$/u, "");
	return docHref(root, slug) || "/";
}

export function isApiReferencePath(pathname: string): boolean {
	const root = docsConfig.apiRoot;
	return pathname === root || pathname.startsWith(`${root}/`);
}
