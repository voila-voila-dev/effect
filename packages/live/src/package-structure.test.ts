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

// The dependency direction between folders, written down once. `message/` is
// the wire format everything shares; `client/` runs in the browser and knows
// nothing else; only `redis/` knows Redis.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["bus", "channel"],
	["bus", "message"],
	["bus", "socket"],
	["channel", "message"],
	["client", "message"],
	["redis", "bus"],
	["redis", "message"],
	["redis", "socket"],
	["socket", "channel"],
	["socket", "message"],
];

const root = import.meta.dirname;
const edges = importEdges({
	root,
	files: listSourceFiles(root),
	contextOf: contextResolver(),
});
const internal = (context: string) => context !== "index.ts";

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
			describeEdges(undeclaredEdges(edges, ALLOWED, internal)),
			"a new dependency between folders: add it to ALLOWED if it is deliberate, or invert it",
		).toStrictEqual([]);
	});

	it("keeps the list free of edges the code no longer has", () => {
		expect(staleEdges(edges, ALLOWED)).toStrictEqual([]);
	});

	// effect/persistence pulls Effect's SQL migrator, whose dynamic import
	// Metro refuses: the root and client entries have to bundle in a React
	// Native app, and in a browser.
	it("keeps the root and client entries free of Redis and of Bun", () => {
		expect(
			["index.ts", "client/index.ts"].flatMap((entry) =>
				reachableSpecifiers(entry).filter(
					(specifier) =>
						specifier.startsWith("effect/persistence") || specifier === "bun",
				),
			),
		).toStrictEqual([]);
	});
});
