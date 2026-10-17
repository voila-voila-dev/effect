import { describe, expect, it } from "bun:test";
import {
	type ContextPair,
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	staleEdges,
	undeclaredEdges,
} from "@voila.dev/effect-ddd/architecture";

// `client/` stands alone; the field readers and the scripted fake build on
// it, and `webhooks/` (a schema) needs nothing.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["fields", "client"],
	["in-memory", "client"],
];

const root = import.meta.dirname;
const edges = importEdges({
	root,
	files: listSourceFiles(root),
	contextOf: contextResolver(),
});
const internal = (context: string) =>
	context !== "index.ts" && context !== "package-structure.test.ts";

describe("package structure", () => {
	it("keeps every dependency between folders on the written list", () => {
		expect(
			describeEdges(undeclaredEdges(edges, ALLOWED, internal)),
			"a new dependency between folders: add it to ALLOWED if it is deliberate, or invert it",
		).toStrictEqual([]);
	});

	it("keeps the list free of edges the code no longer has", () => {
		expect(staleEdges(edges, ALLOWED)).toStrictEqual([]);
	});
});
