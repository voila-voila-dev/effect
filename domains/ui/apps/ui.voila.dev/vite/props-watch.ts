import path from "node:path";
import type { Plugin } from "vite";

import { invalidatePropsManifest } from "./remark-prop-table.ts";

/**
 * Dev only: a props table is generated from `packages/ui`, which Vite has no
 * reason to watch — nothing in the docs imports the source. Without this, a
 * prop added to a component keeps showing the old table until the server
 * restarts.
 */
export function docsPropsWatch(): Plugin {
	const packageSrc = path.join(import.meta.dirname, "../../../packages/ui/src");
	return {
		name: "voila:docs-props-watch",
		apply: "serve",
		configureServer(server) {
			server.watcher.add(packageSrc);
			server.watcher.on("all", (_event, file) => {
				if (!file.startsWith(packageSrc)) return;
				invalidatePropsManifest();
				// The tables are baked into the compiled MDX, so every page that
				// carries one has to be recompiled.
				for (const mod of server.moduleGraph.idToModuleMap.values()) {
					if (mod.id?.includes(".mdx"))
						server.moduleGraph.invalidateModule(mod);
				}
				server.ws.send({ type: "full-reload" });
			});
		},
	};
}
