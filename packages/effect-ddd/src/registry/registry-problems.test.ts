import { describe, expect, it } from "bun:test";
import { registryProblems } from "./registry-problems.ts";

describe("registryProblems", () => {
	it("passes a registry that matches its files", () => {
		expect(
			registryProblems(
				[{ name: "billing.create-invoice" }],
				["billing.create-invoice"],
			),
		).toStrictEqual([]);
	});

	it("reports a duplicate, a name no file backs and a file never registered", () => {
		expect(
			registryProblems(
				[
					{ name: "billing.create-invoice" },
					{ name: "billing.create-invoice" },
					{ name: "billing.typo" },
				],
				["billing.create-invoice", "billing.void-invoice"],
			),
		).toStrictEqual([
			"duplicate use case name: billing.create-invoice",
			'use case "billing.typo" is named after no use-case file',
			'use case "billing.void-invoice" is declared but not registered',
		]);
	});
});
