import { describe, expect, it } from "bun:test";
import { Effect, Exit, Option } from "effect";
import { Organization, OrganizationNameError } from "./organization.ts";

const create = (name: string) =>
	Effect.runSyncExit(Organization.create({ id: "o1", name, ownerId: "alice" }));

describe("Organization", () => {
	it("trims the name it is given", () => {
		const exit = create("  Acme  ");
		expect(Exit.isSuccess(exit) && exit.value.name).toBe("Acme");
	});

	it("refuses a name too short", () => {
		const exit = create(" A ");
		expect(
			Exit.isFailure(exit) && Option.getOrUndefined(Exit.findErrorOption(exit)),
		).toBeInstanceOf(OrganizationNameError);
	});
});
