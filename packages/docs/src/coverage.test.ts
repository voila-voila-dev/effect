import { describe, expect, it } from "bun:test";

import { contextCoverage, coverageTable } from "./coverage.ts";
import type { ReaderDimensions } from "./reader-context.ts";

const dimensions = {
	country: {
		values: ["FR", "LU"],
		audiences: ["teams", "developers"],
		queryParameter: "country",
	},
	language: {
		values: ["en", "other"],
		audiences: ["developers"],
		queryParameter: "language",
	},
} as const satisfies ReaderDimensions;

describe("contextCoverage", () => {
	const cells = contextCoverage({
		dimensions,
		audience: "developers",
		entries: [
			{
				id: "payroll",
				appliesTo: { country: ["FR"], language: ["en"] },
				planned: false,
			},
			{
				id: "translated",
				appliesTo: { country: ["FR"], language: ["other"] },
				planned: true,
			},
		],
	});

	it("files each path and planned path under the contexts it answers", () => {
		expect(cells).toEqual([
			{
				context: { country: "FR", language: "en" },
				paths: ["payroll"],
				planned: [],
			},
			{
				context: { country: "FR", language: "other" },
				paths: [],
				planned: ["translated"],
			},
			{
				context: { country: "LU", language: "en" },
				paths: [],
				planned: [],
			},
			{
				context: { country: "LU", language: "other" },
				paths: [],
				planned: [],
			},
		]);
	});

	it("prints countries as rows and languages as columns", () => {
		expect(
			coverageTable({
				dimensions,
				cells,
				rows: "country",
				columns: "language",
			}),
		).toBe(
			[
				"country \\ language | en      | other",
				"FR                 | payroll | planned: translated",
				"LU                 | MISSING | MISSING",
			].join("\n"),
		);
	});

	it("prints a single column for an audience asked one dimension", () => {
		const teams = contextCoverage({
			dimensions,
			audience: "teams",
			entries: [{ id: "first-invoice", appliesTo: undefined, planned: false }],
		});

		expect(coverageTable({ dimensions, cells: teams, rows: "country" })).toBe(
			[
				"country | paths",
				"FR      | first-invoice",
				"LU      | first-invoice",
			].join("\n"),
		);
	});
});
