import { createFileRoute } from "@tanstack/react-router";

import { docsConfig } from "../../docs.config.ts";
import { NotFound } from "../components/not-found.tsx";

/**
 * Prerendered to `/404.html`, which the Worker serves with a 404 status for
 * any path that has no file (`not_found_handling` in `wrangler.jsonc`).
 */
export const Route = createFileRoute("/404")({
	head: () => ({
		meta: [
			{ title: `Page not found · ${docsConfig.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: NotFound,
});
