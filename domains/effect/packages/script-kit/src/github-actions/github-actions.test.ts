import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { setOutputs } from "./github-actions.ts";

const original = process.env.GITHUB_OUTPUT;
afterEach(() => {
	if (original === undefined) delete process.env.GITHUB_OUTPUT;
	else process.env.GITHUB_OUTPUT = original;
});

describe("setOutputs", () => {
	it("appends one key=value line per output", () => {
		const file = join(mkdtempSync(join(tmpdir(), "script-kit-")), "output");
		process.env.GITHUB_OUTPUT = file;
		Effect.runSync(setOutputs({ url: "https://example.com", count: "2" }));
		expect(readFileSync(file, "utf8")).toBe(
			"url=https://example.com\ncount=2\n",
		);
	});
});
