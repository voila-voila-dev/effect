// Run after `vite build`: every page must have its file. The prerenderer
// retries a page whose fetch failed, and a page that still fails can go missing
// from the output while the build exits 0; the Worker would then answer that
// address with the 404 page.
import { existsSync } from "node:fs";
import { join } from "node:path";

import { contentPagePaths } from "./content-pages.ts";

const output = join(import.meta.dirname, "../dist/client");

// Every page is written to `<path>/index.html` (served at `<path>/`), as the
// site always has been; the home and the 404 page are their own files.
const files = [
	"index.html",
	"404.html",
	"sitemap.xml",
	...contentPagePaths().map((path) => `${path.slice(1)}/index.html`),
];

const missing = files.filter((file) => !existsSync(join(output, file)));

if (missing.length > 0) {
	console.error(
		`These pages were not prerendered:\n${missing.map((file) => `  ${file}`).join("\n")}`,
	);
	process.exit(1);
}
console.info(`All ${files.length} files prerendered.`);
