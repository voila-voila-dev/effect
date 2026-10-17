import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { docsMdx } from "@voila.dev/docs/mdx/plugin";
import {
	defaultClientConditions,
	defaultServerConditions,
	defineConfig,
} from "vite";

import { docsConfig } from "./docs.config.ts";
import { failOnPrerenderError } from "./vite/fail-on-prerender-error.ts";
import { remarkReadme } from "./vite/remark-readme.ts";

// The @voila.dev packages resolve to their sources, so the site builds without
// building them first, and documents the code on its own branch.
const SOURCE_CONDITION = "@voila.dev/source";

export default defineConfig({
	resolve: {
		conditions: [SOURCE_CONDITION, ...defaultClientConditions],
	},
	ssr: {
		resolve: { conditions: [SOURCE_CONDITION, ...defaultServerConditions] },
	},
	plugins: [
		tailwindcss(),
		// The package pages are their READMEs, compiled as Markdown.
		docsMdx({ remarkPlugins: [remarkReadme] }),
		tanstackStart({
			prerender: {
				// Every page is prerendered to a file the Worker serves as is.
				enabled: true,
				crawlLinks: true,
				// `/guides/x.html`, which the Worker serves at `/guides/x`: the canonical
				// address has no trailing slash, and `x/index.html` would redirect to one.
				autoSubfolderIndex: false,
				failOnError: true,
				// The prerenderer fetches each page from a server it starts itself;
				// a connection refused under load costs a retry, not the build.
				concurrency: 4,
				retryCount: 2,
				retryDelay: 500,
				// In-page anchors would only render the same page again.
				filter: (page) => !page.path.includes("#"),
			},
			pages: [
				{
					path: "/404",
					sitemap: { exclude: true },
					prerender: { enabled: true, outputPath: "/404.html" },
				},
			],
			sitemap: { enabled: true, host: docsConfig.url },
		}),
		// After `tanstackStart`, so its prerender runs inside this plugin's watch.
		failOnPrerenderError(),
		viteReact(),
	],
});
