import type { Edge } from "./edge-extraction.ts";

/** A dependency the architecture allows: `source` may import `target`. */
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
