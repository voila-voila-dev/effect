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

// `sending/`, `receiving/` and `webhooks/` are independent: take one
// without the others. Files at the root are shared by all.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["receiving", "describe-outbound-failure.ts"],
	["sending", "describe-outbound-failure.ts"],
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
