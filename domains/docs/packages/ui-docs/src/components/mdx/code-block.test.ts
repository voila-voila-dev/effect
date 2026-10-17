import { describe, expect, it } from "bun:test";

import { codeBlockLabel } from "./code-block.tsx";

describe("codeBlockLabel", () => {
	it("prefers the fence's title, then its language's name", () => {
		expect(
			codeBlockLabel({ "data-title": "api.ts", "data-language": "ts" }, "Text"),
		).toBe("api.ts");
		expect(codeBlockLabel({ "data-language": "bash" }, "Text")).toBe(
			"Terminal",
		);
		expect(codeBlockLabel({ "data-language": "rust" }, "Text")).toBe("rust");
	});

	it("names a fence without a language with the host's word", () => {
		expect(codeBlockLabel({}, "Texte")).toBe("Texte");
	});
});
