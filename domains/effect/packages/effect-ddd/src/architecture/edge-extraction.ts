import { posix } from "node:path";
import { readSource } from "./source-files.ts";

/** One import that crosses from one context to another. */
export interface Edge {
	readonly file: string;
	readonly source: string;
	readonly target: string;
	/** The imported module, relative to the root. */
	readonly module: string;
}

const IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/gu;

function importSpecifiers(contents: string): ReadonlyArray<string> {
	return [...contents.matchAll(IMPORT)].map(([, specifier = ""]) => specifier);
}

/**
 * The root-relative module a specifier names, or `null` for a package import
 * or a path outside the root. `alias` is the subpath-import prefix that maps
 * to the root (`#` for `"imports": { "#*": "./src/*" }`).
 */
export function resolveSpecifier(
	file: string,
	specifier: string,
	alias?: string,
): string | null {
	if (specifier.startsWith(".")) {
		const resolved = posix.normalize(
			posix.join(posix.dirname(file), specifier),
		);
		return resolved.startsWith("..") ? null : resolved;
	}
	if (alias !== undefined && specifier.startsWith(alias)) {
		return specifier.slice(alias.length).replace(/^\//u, "");
	}
	return null;
}

/**
 * Every import between two different contexts of the files under `root`:
 * relative imports, and subpath imports when `alias` is given.
 */
export function importEdges(options: {
	readonly root: string;
	readonly files: ReadonlyArray<string>;
	readonly contextOf: (path: string) => string;
	readonly alias?: string;
}): ReadonlyArray<Edge> {
	return options.files.flatMap((file) => {
		const source = options.contextOf(file);
		return importSpecifiers(readSource(options.root, file)).flatMap(
			(specifier) => {
				const module = resolveSpecifier(file, specifier, options.alias);
				if (module === null) return [];
				const target = options.contextOf(module);
				return target === source ? [] : [{ file, source, target, module }];
			},
		);
	});
}

/** One line per edge, sorted, for an assertion message a reader can act on. */
export function describeEdges(
	edges: ReadonlyArray<Edge>,
): ReadonlyArray<string> {
	return edges.map((edge) => `${edge.file} -> ${edge.module}`).sort();
}
