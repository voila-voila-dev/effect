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

// The dependency direction between this package's folders, written down once.
// `outbox-store/` is the contract everything else leans on; the stores
// (`memory/`, `postgres/`) implement it and nothing depends on them, so the
// Postgres subpath can never leak into the root entry.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["delivery", "event-bus"],
	["delivery", "outbox-store"],
	["delivery", "subscriber"],
	["event-bus", "message-id"],
	["event-bus", "outbox-store"],
	["memory", "outbox-store"],
	["postgres", "outbox-store"],
	["subscriber", "event-bus"],
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
