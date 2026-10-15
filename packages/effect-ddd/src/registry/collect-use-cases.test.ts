import { describe, expect, it } from "bun:test";
import { collectUseCases } from "./collect-use-cases.ts";
import {
	createInvoice,
	readReport,
	voidInvoice,
} from "./fixtures.test-helper.ts";

describe("collectUseCases", () => {
	it("keeps the use cases a module exports and nothing else", () => {
		expect(
			collectUseCases([
				{ createInvoice, voidInvoice, helper: () => 1, CONSTANT: "x" },
				{ readReport },
			]).map((unit) => unit.name),
		).toStrictEqual([
			"billing.create-invoice",
			"billing.void-invoice",
			"reporting.read-report",
		]);
	});
});
