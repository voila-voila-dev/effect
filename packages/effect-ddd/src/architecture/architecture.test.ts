import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	ratchet,
	staleEdges,
	undeclaredEdges,
	useCaseNameOf,
} from "./index.ts";

const root = mkdtempSync(join(tmpdir(), "voila-ddd-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

function write(file: string, contents: string) {
	mkdirSync(dirname(join(root, file)), { recursive: true });
	writeFileSync(join(root, file), contents);
}

write(
	"billing/use-cases/issue-invoice-use-case.ts",
	'import { Money } from "../../platform/money/money.ts";\nimport { Org } from "#organization/org.ts";\nimport { Effect } from "effect";',
);
write(
	"billing/use-cases/issue-invoice-use-case.test.ts",
	'import "../../organization/org.ts";',
);
write(
	"organization/org.ts",
	'import "../billing/use-cases/issue-invoice-use-case.ts";',
);
write(
	"platform/money/money.ts",
	'export const Money = 1;\nimport("./local.ts");',
);
write("platform/money/local.ts", "");
write(
	"platform/integrations/vies/vies.ts",
	'import "#platform/money/money.ts";',
);

const contextOf = contextResolver({
	groupingDirectories: ["platform", "platform/integrations"],
});

describe("listSourceFiles", () => {
	it("lists the sources, tests left out", () => {
		expect(listSourceFiles(root)).toStrictEqual([
			"billing/use-cases/issue-invoice-use-case.ts",
			"organization/org.ts",
			"platform/integrations/vies/vies.ts",
			"platform/money/local.ts",
			"platform/money/money.ts",
		]);
	});
});

describe("contextResolver", () => {
	it("looks through grouping folders, nested ones included", () => {
		expect(contextOf("billing/use-cases/x.ts")).toBe("billing");
		expect(contextOf("platform/money/money.ts")).toBe("platform/money");
		expect(contextOf("platform/integrations/vies/vies.ts")).toBe(
			"platform/integrations/vies",
		);
	});

	it("names a use case after its file", () => {
		expect(
			useCaseNameOf("billing/use-cases/issue-invoice-use-case.ts", contextOf),
		).toBe("billing.issue-invoice");
	});
});

describe("importEdges", () => {
	const edges = importEdges({
		root,
		files: listSourceFiles(root),
		contextOf,
		alias: "#",
	});

	it("finds relative and aliased imports across contexts, and skips packages", () => {
		expect(describeEdges(edges)).toStrictEqual([
			"billing/use-cases/issue-invoice-use-case.ts -> organization/org.ts",
			"billing/use-cases/issue-invoice-use-case.ts -> platform/money/money.ts",
			"organization/org.ts -> billing/use-cases/issue-invoice-use-case.ts",
			"platform/integrations/vies/vies.ts -> platform/money/money.ts",
		]);
	});

	it("flags the edges the table does not declare, and the stale ones", () => {
		const business = (context: string) => !context.startsWith("platform");
		const allowed = [
			["billing", "organization"],
			["billing", "shop"],
		] as const;
		expect(
			undeclaredEdges(edges, allowed, business).map(
				(e) => `${e.source} -> ${e.target}`,
			),
		).toStrictEqual(["organization -> billing"]);
		expect(staleEdges(edges, allowed)).toStrictEqual(["billing -> shop"]);
	});
});

describe("ratchet", () => {
	it("fails on a new offender and on a fixed entry left in the baseline", () => {
		expect(ratchet(["a.ts", "b.ts"], ["b.ts", "c.ts"])).toStrictEqual({
			added: ["c.ts"],
			fixed: ["a.ts"],
		});
	});
});
