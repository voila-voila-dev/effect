import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
	type ContextPair,
	describeEdges,
	importEdges,
	listSourceFiles,
	staleEdges,
	undeclaredEdges,
} from "@voila.dev/effect-ddd/architecture";

// The dependency direction between folders, written down once. The modules at
// the root are the core a site and its React layer read; `api-reference/`
// shares its HTTP types with the core's navigation and search, and lists its
// operations as navigation groups; `mdx/` is the build-time side, reached only
// through `@voila.dev/docs/mdx/plugin`.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["(root)", "api-reference"],
	["api-reference", "(root)"],
	["mdx", "(root)"],
];

const root = import.meta.dirname;
const contextOf = (path: string) =>
	path.includes("/") ? (path.split("/")[0] ?? path) : "(root)";
const files = listSourceFiles(root, {
	exclude: (file) => file.startsWith("api-reference/fixtures/"),
});
const edges = importEdges({ root, files, contextOf });

/** Every module specifier reachable from `entry` through relative imports. */
function reachableSpecifiers(entry: string): ReadonlyArray<string> {
	const seen = new Set<string>();
	const specifiers: Array<string> = [];
	const visit = (file: string): void => {
		if (seen.has(file)) return;
		seen.add(file);
		for (const [, specifier] of readFileSync(file, "utf8").matchAll(
			/from "([^"]+)"/gu,
		)) {
			if (specifier === undefined) continue;
			if (specifier.startsWith(".")) visit(resolve(dirname(file), specifier));
			else specifiers.push(specifier);
		}
	};
	visit(resolve(root, entry));
	return specifiers;
}

describe("package structure", () => {
	it("keeps every dependency between folders on the written list", () => {
		expect(
			describeEdges(undeclaredEdges(edges, ALLOWED)),
			"a new dependency between folders: add it to ALLOWED if it is deliberate, or invert it",
		).toStrictEqual([]);
	});

	it("keeps the list free of edges the code no longer has", () => {
		expect(staleEdges(edges, ALLOWED)).toStrictEqual([]);
	});

	// A site's pages import the core and the API reference in the browser: the
	// compilers (Vite, unified, Shiki) stay behind `mdx/`, and nothing reads
	// the file system or Bun.
	it("keeps every module outside mdx/ free of the build-time packages", () => {
		const buildTime =
			/^(vite|shiki|@shikijs\/|@mdx-js\/|remark-|rehype-|mdast-|hast-|unist-|estree-|node:|bun)/u;
		expect(
			files
				.filter((file) => !file.startsWith("mdx/"))
				.flatMap((file) =>
					reachableSpecifiers(file)
						.filter((specifier) => buildTime.test(specifier))
						.map((specifier) => `${file} -> ${specifier}`),
				),
		).toStrictEqual([]);
	});
});
