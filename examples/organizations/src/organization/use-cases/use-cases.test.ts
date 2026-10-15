import { describe, expect, it } from "bun:test";
import { AccessDeniedError } from "@voila.dev/effect-ddd";
import { Effect, Exit, Option } from "effect";
import { UserActor } from "../../identity/actor.ts";
import type { Permission } from "../../identity/permission.ts";
import { inMemoryOrganizationRepository } from "../in-memory-organization-repository.ts";
import { CreateOrganizationUseCase } from "./create-organization-use-case.ts";
import { RenameOrganizationUseCase } from "./rename-organization-use-case.ts";

/** Alice creates "Acme"; then a user holding `permissions` in it renames it. */
function renameAs(permissions: ReadonlyArray<Permission>) {
	return Effect.gen(function* () {
		const organization = yield* CreateOrganizationUseCase.execute({
			actor: new UserActor({ userId: "alice", permissions: {} }),
			payload: { name: "Acme" },
		});
		return yield* RenameOrganizationUseCase.execute({
			actor: new UserActor({
				userId: "bob",
				permissions: { [organization.id]: [...permissions] },
			}),
			payload: { organizationId: organization.id, name: "Acme Corp" },
		});
	}).pipe(Effect.provide(inMemoryOrganizationRepository()), Effect.runSyncExit);
}

describe("organization use cases", () => {
	it("lets a manager rename the organization", () => {
		const exit = renameAs(["organization.manage"]);
		expect(Exit.isSuccess(exit) && exit.value.name).toBe("Acme Corp");
	});

	it("refuses a member without the permission", () => {
		const exit = renameAs(["organization.read"]);
		expect(
			Exit.isFailure(exit) && Option.getOrUndefined(Exit.findErrorOption(exit)),
		).toBeInstanceOf(AccessDeniedError);
	});
});
