import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkSmartypants from "remark-smartypants";
import { routeMdxQueries } from "./mdx-queries.ts";
import { rehypeExportHeadings } from "./rehype-export-headings.ts";
import { rehypeExportSteps } from "./rehype-export-steps.ts";
import { rehypeKeepExports } from "./rehype-keep-exports.ts";
import { shikiCodeMeta } from "./shiki-code-meta.ts";
/**
 * @mdx-js/rollup types its plugin for Rollup, whose transform result Vite
 * types stricter under `exactOptionalPropertyTypes`; the object is the same.
 */
function mdxPlugin(options) {
    return mdx(options);
}
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
 * same page down to its `frontmatter`, `headings` and `steps` exports. A
 * `.md` file goes through the same pipeline as plain Markdown (no JSX), so a
 * site can publish a README as a page.
 */
export function docsMdx(options = {}) {
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
        }),
    };
}
