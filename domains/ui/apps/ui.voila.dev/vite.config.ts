import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { docsMdx } from "@voila.dev/docs/mdx/plugin";
import {
	defaultClientConditions,
	defaultServerConditions,
	defineConfig,
	type UserConfig,
} from "vite";

import { docsConfig } from "./docs.config.ts";
import { contentPagePaths } from "./vite/content-pages.ts";
import { failOnPrerenderError } from "./vite/fail-on-prerender-error.ts";
import { docsPropsWatch } from "./vite/props-watch.ts";
import { remarkPropTable } from "./vite/remark-prop-table.ts";

// The @voila.dev packages resolve to their sources, so the site builds without
// building them first, and documents the code on its own branch.
const SOURCE_CONDITION = "@voila.dev/source";

export default defineConfig({
	resolve: {
		alias: {
			// The pages import their live examples from `@/examples/…`.
			"@": path.join(import.meta.dirname, "src"),
		},
		conditions: [SOURCE_CONDITION, ...defaultClientConditions],
	},
	ssr: {
		resolve: { conditions: [SOURCE_CONDITION, ...defaultServerConditions] },
	},
	// MapLibre 6 is ESM-only and starts its worker from a URL relative to its
	// own module. Pre-bundling rewrites that module into `deps/`, where the
	// worker URL no longer resolves - the worker never starts, and the map
	// keeps drawing its raster layers on the main thread while every vector
	// layer (water, roads, borders, labels) silently stays missing.
	optimizeDeps: {
		exclude: ["maplibre-gl"],
	},
	plugins: [
		tailwindcss(),
		// `<PropTable of="Button" />` becomes the component's props table at
		// build time, read from `packages/ui` by the type checker.
		docsMdx({ remarkPlugins: [remarkPropTable] }),
		docsPropsWatch(),
		tanstackStart({
			prerender: {
				// Every page is prerendered to a file the Worker serves as is.
				enabled: true,
				crawlLinks: true,
				// `/ui/button/index.html`, served at `/ui/button/`: the addresses the
				// site has always had.
				autoSubfolderIndex: true,
				failOnError: true,
				// The prerenderer fetches each page from a server it starts itself;
				// a connection refused under load costs a retry, not the build.
				concurrency: 4,
				retryCount: 2,
				retryDelay: 500,
				// In-page anchors would only render the same page again.
				filter: (page) => !page.path.includes("#"),
			},
			// Every page, so none depends on the crawl finding a link to it.
			pages: [
				...contentPagePaths().map((path) => ({ path })),
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
		{
			// On Rolldown-Vite, `output.strictExecutionOrder` severs Base UI's
			// `createSelectorMemoized` import bindings in production builds (same
			// workaround as the Storybook app — see its `.storybook/main.ts`).
			name: "voila:disable-strict-execution-order",
			enforce: "post",
			config(config: UserConfig) {
				const output = config.build?.rolldownOptions?.output;
				if (output && !Array.isArray(output)) {
					// strictExecutionOrder is experimental and not in the types yet.
					(output as Record<string, unknown>).strictExecutionOrder = false;
				}
			},
		},
	],
});
