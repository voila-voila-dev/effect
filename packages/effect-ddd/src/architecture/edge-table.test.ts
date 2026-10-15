import { describe, expect, it } from "bun:test";
import type { Edge } from "./edge-extraction.ts";
import { staleEdges, undeclaredEdges } from "./edge-table.ts";

function edge(source: string, target: string): Edge {
	return { file: `${source}/x.ts`, source, target, module: `${target}/y.ts` };
}

const edges = [
	edge("billing", "organization"),
	edge("organization", "billing"),
	edge("platform/money", "billing"),
];
const allowed = [
	["billing", "organization"],
	["billing", "shop"],
] as const;

describe("undeclaredEdges", () => {
	it("flags the edges the table does not declare", () => {
		expect(undeclaredEdges(edges, allowed)).toStrictEqual([
			edge("organization", "billing"),
			edge("platform/money", "billing"),
		]);
	});

	it("checks only the contexts among selects", () => {
		expect(
			undeclaredEdges(
				edges,
				allowed,
				(context) => !context.startsWith("platform"),
			),
		).toStrictEqual([edge("organization", "billing")]);
	});
});

describe("staleEdges", () => {
	it("lists the pairs no import uses any more", () => {
		expect(staleEdges(edges, allowed)).toStrictEqual(["billing -> shop"]);
	});
});
