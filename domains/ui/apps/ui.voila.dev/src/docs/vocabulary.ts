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

/**
 * What every page's frontmatter may say: the shared fields, and where the page
 * sits in its section (`src/content/docs/sections.ts`). Which of `category`
 * and `sidebar.order` a page needs is its section's call;
 * `src/docs/navigation.ts` enforces it.
 */
export const docFrontmatterSchema = docFrontmatter(
	{
		icons: iconNames(),
		audiences: docsConfig.vocabulary.audiences,
		stages: docsConfig.vocabulary.stages,
	},
	{
		extend: {
			/** The page's group, in a section with categories. */
			category: z.string().min(1).optional(),
			/** The page's place, in a section ordered by number. */
			sidebar: z
				.strictObject({ order: z.number().int().nonnegative() })
				.optional(),
		},
	},
);

/**
 * Every page here is a reference for every reader, so the pages do not say
 * it: these fill the shared fields a page leaves out.
 */
const PAGE_DEFAULTS = { audience: ["everyone"], kind: "reference" };

/** A page's validated frontmatter: a typo in it fails the build with the file's name. */
export function frontmatterOf(frontmatter: unknown, file: string) {
	const parsed = docFrontmatterSchema.safeParse({
		...PAGE_DEFAULTS,
		...(frontmatter as object),
	});
	if (!parsed.success) {
		throw new Error(
			`Invalid frontmatter in ${file}:\n${z.prettifyError(parsed.error)}`,
		);
	}
	return parsed.data;
}

/** Where a page is served: `ui/button` is `/ui/button`. */
export function pageHref(slug: string): string {
	const root = docsConfig.docsRoot.replace(/\/+$/u, "");
	return docHref(root, slug) || "/";
}
