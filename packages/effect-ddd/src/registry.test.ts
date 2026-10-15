import { describe, expect, it } from "bun:test";
import { Effect, Schema } from "effect";
import { Gate } from "./gate.ts";
import { permissionRef } from "./permission-ref.ts";
import {
	collectUseCases,
	permissionCatalogue,
	registryProblems,
	unknownPermissions,
} from "./registry.ts";
import { UseCase } from "./use-case.ts";

const Input = Schema.Struct({ payload: Schema.Struct({}) });

function unit(name: string, permission: string) {
	return UseCase.make({
		name,
		input: Input,
		gate: Gate.when<typeof Input.Type>({
			label: permission,
			permissions: [permissionRef("organization", permission)],
			allows: () => true,
		}),
		execute: () => Effect.void,
	});
}

const createInvoice = unit("billing.create-invoice", "invoice.manage");
const voidInvoice = unit("billing.void-invoice", "invoice.manage");
const readReport = unit("reporting.read-report", "report.read");

describe("collectUseCases", () => {
	it("keeps the use cases a module exports and nothing else", () => {
		expect(
			collectUseCases([
				{ createInvoice, voidInvoice, helper: () => 1, CONSTANT: "x" },
				{ readReport },
			]).map((u) => u.name),
		).toStrictEqual([
			"billing.create-invoice",
			"billing.void-invoice",
			"reporting.read-report",
		]);
	});
});

describe("registryProblems", () => {
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

describe("permissions", () => {
	const units = [createInvoice, voidInvoice, readReport];

	it("flags a permission the application does not know", () => {
		expect(
			unknownPermissions(units, { organization: ["invoice.manage"] }),
		).toStrictEqual(["reporting.read-report: organization:report.read"]);
	});

	it("lists what each permission unlocks", () => {
		expect(Object.fromEntries(permissionCatalogue(units))).toStrictEqual({
			"organization:invoice.manage": [
				"billing.create-invoice",
				"billing.void-invoice",
			],
			"organization:report.read": ["reporting.read-report"],
		});
	});
});
