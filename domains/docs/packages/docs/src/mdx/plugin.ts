import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkSmartypants from "remark-smartypants";
import type { Plugin } from "vite";

import { routeMdxQueries } from "./mdx-queries.ts";
import { rehypeExportHeadings } from "./rehype-export-headings.ts";
import { rehypeExportSteps } from "./rehype-export-steps.ts";
import { rehypeExportText } from "./rehype-export-text.ts";
import { rehypeKeepExports } from "./rehype-keep-exports.ts";
import { shikiCodeMeta } from "./shiki-code-meta.ts";

/**
 * @mdx-js/rollup types its plugin for Rollup, whose transform result Vite
 * types stricter under `exactOptionalPropertyTypes`; the object is the same.
 */
function mdxPlugin(options: Parameters<typeof mdx>[0]): Plugin {
	return mdx(options) as Plugin;
}

type PluggableList = NonNullable<
	NonNullable<Parameters<typeof mdx>[0]>["remarkPlugins"]
>;

/** What a site adds to the pipeline: its own remark plugins, run after the built-in ones on the page, its `?meta` and its `?text`. */
export interface DocsMdxOptions {
	/** Run after frontmatter, GFM and smart quotes, before the headings get their ids. */
	remarkPlugins?: PluggableList;
}

/** How much of a page's prose `?text` keeps: enough to find a page by what it says, little enough for an index of hundreds of pages. */
const TEXT_LENGTH = 8000;

const builtInRemarkPlugins = [
	remarkFrontmatter,
	remarkMdxFrontmatter,
	remarkGfm,
	remarkSmartypants,
];

/**
 * The Vite plugin that compiles `.mdx` pages: frontmatter, GFM, smart quotes,
 * an id on every heading (exported as `headings`), the first `<Steps>` exported as `steps`, and code fences highlighted
 * at build time in a light and a dark theme. `page.mdx?meta` compiles the
 * same page down to its `frontmatter`, `headings` and `steps` exports (its
 * imports dropped, so listing the pages loads none of what they import), and
 * `page.mdx?text` down to `text`, its prose without code listings, for a
 * search index. A
 * `.md` file goes through the same pipeline as plain Markdown (no JSX), so a
 * site can publish a README as a page.
 */
export function docsMdx(options: DocsMdxOptions = {}): Plugin {
	const remarkPlugins = [
		...builtInRemarkPlugins,
		...(options.remarkPlugins ?? []),
	];
	return {
		enforce: "pre",
		...routeMdxQueries({
			page: mdxPlugin({
				remarkPlugins,
				rehypePlugins: [
					rehypeSlug,
					rehypeExportHeadings,
					rehypeExportSteps,
					[
						rehypeShiki,
						{
							themes: { light: "github-light", dark: "github-dark" },
							defaultColor: false,
							transformers: [shikiCodeMeta],
						},
					],
				],
			}),
			meta: mdxPlugin({
				remarkPlugins,
				rehypePlugins: [
					rehypeSlug,
					rehypeExportHeadings,
					rehypeExportSteps,
					rehypeKeepExports,
				],
			}),
			text: mdxPlugin({
				remarkPlugins,
				rehypePlugins: [[rehypeExportText, { maxLength: TEXT_LENGTH }]],
			}),
		}),
	};
}
