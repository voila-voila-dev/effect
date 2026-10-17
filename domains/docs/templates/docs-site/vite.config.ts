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

// Platform monorepo only: the @voila.dev packages resolve to their sources, so
// the site builds without building them first. A cloned site deletes it and
// the two `conditions` below, and reads the packages' built files from npm.
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
		docsMdx(),
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
				// The API index's route id: `/api` serves it already.
				{
					path: "/api/",
					prerender: { enabled: false },
					sitemap: { exclude: true },
				},
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
