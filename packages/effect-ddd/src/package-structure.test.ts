import { describe, expect, it } from "bun:test";
import {
	type ContextPair,
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	staleEdges,
	undeclaredEdges,
} from "./architecture/index.ts";

// This package held to its own tools: the dependency direction between its
// folders, written down once. `architecture/` stands alone: it reads files and
// knows nothing of use cases at runtime.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["gate", "access-denied-error.ts"],
	["gate", "permission"],
	["metrics", "access-denied-error.ts"],
	["use-case", "access-denied-error.ts"],
	["use-case", "gate"],
	["use-case", "metrics"],
	["registry", "permission"],
	["registry", "use-case"],
];

const root = import.meta.dirname;
const edges = importEdges({
	root,
	files: listSourceFiles(root),
	contextOf: contextResolver(),
});
const internal = (context: string) => context !== "index.ts";

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
