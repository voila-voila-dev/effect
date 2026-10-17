import { afterAll, describe, expect, it } from "bun:test";
import { contextResolver } from "./context-resolver.ts";
import {
	describeEdges,
	importEdges,
	resolveSpecifier,
} from "./edge-extraction.ts";
import { listSourceFiles } from "./source-files.ts";
import { sourceTree } from "./source-tree.test-helper.ts";

describe("resolveSpecifier", () => {
	it("resolves relative and aliased imports, and skips packages", () => {
		expect(resolveSpecifier("billing/a/b.ts", "../c.ts")).toBe("billing/c.ts");
		expect(resolveSpecifier("billing/b.ts", "#platform/m.ts", "#")).toBe(
			"platform/m.ts",
		);
		expect(resolveSpecifier("billing/b.ts", "#platform/m.ts")).toBeNull();
		expect(resolveSpecifier("billing/b.ts", "effect")).toBeNull();
		expect(resolveSpecifier("b.ts", "../outside.ts")).toBeNull();
	});
});

describe("importEdges", () => {
	const tree = sourceTree({
		"billing/issue.ts": [
			'import { Money } from "../platform/money/money.ts";',
			'import { Org } from "#organization/org.ts";',
			'import { Effect } from "effect";',
			'import { local } from "./local.ts";',
		].join("\n"),
		"billing/local.ts": "",
		"organization/org.ts": 'const lazy = () => import("../billing/issue.ts");',
		"platform/money/money.ts": "",
	});
	afterAll(tree.remove);

	const edges = importEdges({
		root: tree.root,
		files: listSourceFiles(tree.root),
		contextOf: contextResolver({ groupingDirectories: ["platform"] }),
		alias: "#",
	});

	it("keeps the imports that cross contexts, dynamic ones included", () => {
		expect(describeEdges(edges)).toStrictEqual([
			"billing/issue.ts -> organization/org.ts",
			"billing/issue.ts -> platform/money/money.ts",
			"organization/org.ts -> billing/issue.ts",
		]);
		expect(edges.map((edge) => edge.target)).toContain("platform/money");
	});
});
