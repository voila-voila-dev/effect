import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const content = join(import.meta.dirname, "../src/content/docs");

/**
 * Every page's path, read off the content folder: `/ui/button` for
 * `ui/button.mdx`. The prerender is handed the whole list instead of relying
 * on the crawl to reach every page, and the check after the build reads it.
 */
export function contentPagePaths(): Array<string> {
	return readdirSync(content, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
		.map(
			(entry) =>
				`/${relative(content, join(entry.parentPath, entry.name))
					.replace(/\.mdx$/u, "")
					.split(sep)
					.join("/")}`,
		)
		.sort();
}
