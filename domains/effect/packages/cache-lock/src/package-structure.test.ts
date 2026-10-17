import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
	type ContextPair,
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	staleEdges,
	undeclaredEdges,
} from "@voila.dev/effect-ddd/architecture";

// The dependency direction between folders, written down once. The three
// contracts stand alone, and only `redis/` knows Redis: that is what keeps the
// root entry free of it. `rate-limit/` leans on Effect's own limiter, not on
// `cache/`, so a cache outage and a limiter outage stay separate.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["redis", "cache"],
	["redis", "lock"],
	["redis", "rate-limit"],
	["redis", "store"],
	["store", "rate-limit"],
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

	// The edge check above leaves `index.ts` out, so this one covers it.
	it("keeps the root entry free of Redis", () => {
		expect(
			describeEdges(edges.filter(({ target }) => target === "redis")),
		).toStrictEqual([]);
	});

	// effect/persistence pulls Effect's SQL migrator, whose dynamic import
	// Metro refuses: the root entry has to bundle in a React Native app.
	it("keeps the root entry free of effect/persistence", () => {
		const seen = new Set<string>();
		const persistence: Array<string> = [];
		const visit = (file: string): void => {
			if (seen.has(file)) return;
			seen.add(file);
			for (const [, specifier] of readFileSync(file, "utf8").matchAll(
				/from "([^"]+)"/gu,
			)) {
				if (specifier === undefined) continue;
				if (specifier.startsWith("effect/persistence")) persistence.push(file);
				if (specifier.startsWith(".")) visit(resolve(dirname(file), specifier));
			}
		};
		visit(resolve(root, "index.ts"));
		expect(
			persistence.map((file) => file.slice(root.length + 1)),
		).toStrictEqual([]);
	});
});
