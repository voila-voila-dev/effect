import { createRouter } from "@tanstack/react-router";

import { NotFound } from "./components/not-found.tsx";
import { routeTree } from "./routeTree.gen.ts";

export function getRouter() {
	return createRouter({
		routeTree,
		// A page's body is its own chunk: hydrating before it arrives would swap
		// the prerendered body for the Suspense fallback and back.
		hydrate: async () => {
			const { preloadDocContentAt } = await import("./docs/pages.ts");
			await preloadDocContentAt(window.location.pathname).catch(
				() => undefined,
			);
		},
		defaultPreload: "intent",
		defaultNotFoundComponent: NotFound,
		scrollRestoration: true,
		// The pages are served at `/ui/button/` (each is `ui/button/index.html`);
		// the router's own paths have no trailing slash.
		trailingSlash: "never",
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
