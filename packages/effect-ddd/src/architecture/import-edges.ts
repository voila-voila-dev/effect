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

/**
 * Resolves a specifier to a root-relative module, or `null` for a package
 * import. `alias` is the subpath-import prefix that maps to the root (`#` for
 * `"imports": { "#*": "./src/*" }`).
 */
function resolveSpecifier(
	file: string,
	specifier: string,
	alias: string | undefined,
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
		return [...readSource(options.root, file).matchAll(IMPORT)].flatMap(
			([, specifier = ""]) => {
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

export type ContextPair = readonly [source: string, target: string];

function pairKey(source: string, target: string): string {
	return `${source} -> ${target}`;
}

/**
 * The edges between two contexts `among` selects that the table does not
 * list. The table is the architecture's written decisions: an edge outside it
 * is an import that happened to compile.
 */
export function undeclaredEdges(
	edges: ReadonlyArray<Edge>,
	allowed: ReadonlyArray<ContextPair>,
	among: (context: string) => boolean = () => true,
): ReadonlyArray<Edge> {
	const table = new Set(
		allowed.map(([source, target]) => pairKey(source, target)),
	);
	return edges.filter(
		(edge) =>
			among(edge.source) &&
			among(edge.target) &&
			!table.has(pairKey(edge.source, edge.target)),
	);
}

/** The table's pairs no import uses any more, so the table keeps saying what the code does. */
export function staleEdges(
	edges: ReadonlyArray<Edge>,
	allowed: ReadonlyArray<ContextPair>,
): ReadonlyArray<string> {
	const live = new Set(edges.map((edge) => pairKey(edge.source, edge.target)));
	return allowed
		.map(([source, target]) => pairKey(source, target))
		.filter((pair) => !live.has(pair));
}
