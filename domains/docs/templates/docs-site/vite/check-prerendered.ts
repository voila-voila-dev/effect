// Run after `vite build`: every page the sidebar lists must have its file.
// The prerenderer retries a page whose fetch failed, and a page that still
// fails can go missing from the output while the build exits 0; the Worker
// would then answer that address with the 404 page.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { slugsOf } from "@voila.dev/docs/navigation";

import { docsNavigation } from "../src/content/docs/navigation.ts";
import { pageHref } from "../src/docs/vocabulary.ts";

const output = join(import.meta.dirname, "../dist/client");

const hrefs = [
	...docsNavigation.flatMap((tab) =>
		"groups" in tab
			? tab.groups.flatMap((group) => slugsOf(group.pages).map(pageHref))
			: [],
	),
	"/404",
];

const missing = hrefs.filter(
	(href) =>
		!existsSync(join(output, href === "/" ? "index.html" : `${href}.html`)),
);

if (missing.length > 0) {
	console.error(
		`These pages were not prerendered:\n${missing.map((href) => `  ${href}`).join("\n")}`,
	);
	process.exit(1);
}
console.info(`All ${hrefs.length} pages prerendered.`);
