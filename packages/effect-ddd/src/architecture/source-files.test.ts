import { afterAll, describe, expect, it } from "bun:test";
import { listSourceFiles, readSource } from "./source-files.ts";
import { sourceTree } from "./source-tree.test-helper.ts";

const tree = sourceTree({
	"billing/invoice.ts": "export const invoice = 1;",
	"billing/invoice.test.ts": "",
	"billing/fixtures.test-helper.ts": "",
	"billing/types.d.ts": "",
	"billing/generated.ts": "",
	"README.md": "",
});
afterAll(tree.remove);

describe("listSourceFiles", () => {
	it("lists the sources, tests, helpers and declarations left out", () => {
		expect(listSourceFiles(tree.root)).toStrictEqual([
			"billing/generated.ts",
			"billing/invoice.ts",
		]);
	});

	it("drops what exclude names", () => {
		expect(
			listSourceFiles(tree.root, {
				exclude: (file) => file.endsWith("generated.ts"),
			}),
		).toStrictEqual(["billing/invoice.ts"]);
	});
});

describe("readSource", () => {
	it("reads a file relative to the root", () => {
		expect(readSource(tree.root, "billing/invoice.ts")).toBe(
			"export const invoice = 1;",
		);
	});
});
