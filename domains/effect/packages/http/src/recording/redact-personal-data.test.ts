import { describe, expect, it } from "bun:test";
import { redactPersonalData } from "./redact-personal-data.ts";

describe("redactPersonalData", () => {
	it.each([
		["no account for jane.doe@example.com", "no account for «email»"],
		["card 4242 4242 4242 4242 declined", "card «id» declined"],
		["call +44 20 7946 0958", "call «phone»"],
		["call 06 12 34 56 78", "call «phone»"],
		["id 123456789012", "id «id»"],
	])("masks %p", (input, expected) => {
		expect(redactPersonalData(input)).toBe(expected);
	});

	it("leaves a status, a short number and a uuid alone", () => {
		const text =
			"HTTP 404 after 3 tries, request 0b6f5d2e-8c4a-4b6e-9f1a-2d3c4b5a6e7f";
		expect(redactPersonalData(text)).toBe(text);
	});
});
