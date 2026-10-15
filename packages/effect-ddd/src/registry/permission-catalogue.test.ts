import { describe, expect, it } from "bun:test";
import {
	createInvoice,
	readReport,
	voidInvoice,
} from "./fixtures.test-helper.ts";
import {
	permissionCatalogue,
	unknownPermissions,
} from "./permission-catalogue.ts";

const units = [createInvoice, voidInvoice, readReport];

describe("unknownPermissions", () => {
	it("flags a permission the application does not know", () => {
		expect(
			unknownPermissions(units, { organization: ["invoice.manage"] }),
		).toStrictEqual(["reporting.read-report: organization:report.read"]);
	});
});

describe("permissionCatalogue", () => {
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
