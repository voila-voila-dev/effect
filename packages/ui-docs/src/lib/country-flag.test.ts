import { describe, expect, it } from "bun:test";

import { countryFlag } from "./country-flag.ts";

describe("countryFlag", () => {
	it("spells a country code in regional indicator symbols", () => {
		expect(countryFlag("FR")).toBe("🇫🇷");
		expect(countryFlag("lu")).toBe("🇱🇺");
	});

	it("draws nothing for a value that is not a country code", () => {
		expect(countryFlag("other")).toBe("");
		expect(countryFlag("")).toBe("");
	});
});
