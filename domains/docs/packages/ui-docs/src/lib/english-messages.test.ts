import { describe, expect, it } from "bun:test";

import { englishMessages } from "./english-messages.ts";

describe("englishMessages", () => {
	it("counts in the singular and the plural", () => {
		expect(englishMessages.guide.pathLength(1)).toBe("1 step");
		expect(englishMessages.guide.pathLength(4)).toBe("4 steps");
		expect(englishMessages.api.childFields(2)).toBe("2 child fields");
	});

	it("reads a verification day as a calendar day, wherever the reader is", () => {
		expect(englishMessages.guide.lastVerified("2026-10-03")).toBe(
			"Last checked on October 3, 2026",
		);
	});

	it("asks an assistant to read the page it is given", () => {
		expect(englishMessages.aiPrompt("https://example.com/docs")).toContain(
			"https://example.com/docs",
		);
	});
});
