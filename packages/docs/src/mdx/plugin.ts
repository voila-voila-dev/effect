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
import { rehypeKeepExports } from "./rehype-keep-exports.ts";
import { shikiCodeMeta } from "./shiki-code-meta.ts";

/**
 * @mdx-js/rollup types its plugin for Rollup, whose transform result Vite
 * types stricter under `exactOptionalPropertyTypes`; the object is the same.
 */
function mdxPlugin(options: Parameters<typeof mdx>[0]): Plugin {
	return mdx(options) as Plugin;
}

const remarkPlugins = [
	remarkFrontmatter,
	remarkMdxFrontmatter,
	remarkGfm,
	remarkSmartypants,
];

/**
 * The Vite plugin that compiles `.mdx` pages: frontmatter, GFM, smart quotes,
 * an id on every heading (exported as `headings`), the first `<Steps>` exported as `steps`, and code fences highlighted
 * at build time in a light and a dark theme. `page.mdx?meta` compiles the
 * same page down to its `frontmatter`, `headings` and `steps` exports.
 */
export function docsMdx(): Plugin {
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
		}),
	};
}
