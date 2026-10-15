import { describe, expect, it } from "bun:test";
import { AccessDeniedError } from "@voila.dev/effect-ddd";
import { Effect, Exit, Option } from "effect";
import { UserActor } from "../../identity/actor.ts";
import { inMemoryOrganizationRepository } from "../organization-repository-service.ts";
import { CreateOrganizationUseCase } from "./create-organization-use-case.ts";
import { RenameOrganizationUseCase } from "./rename-organization-use-case.ts";

function run<A, E>(effect: Effect.Effect<A, E, never>) {
	return Effect.runSyncExit(effect);
}

const scenario = (rename: (organizationId: string) => UserActor) =>
	Effect.gen(function* () {
		const organization = yield* CreateOrganizationUseCase.execute({
			actor: new UserActor({ userId: "alice", permissions: {} }),
			payload: { name: "Acme" },
		});
		return yield* RenameOrganizationUseCase.execute({
			actor: rename(organization.id),
			payload: { organizationId: organization.id, name: "Acme Corp" },
		});
	}).pipe(Effect.provide(inMemoryOrganizationRepository()));

describe("organization use cases", () => {
	it("lets a manager rename the organization", () => {
		const exit = run(
			scenario(
				(id) =>
					new UserActor({
						userId: "alice",
						permissions: { [id]: ["organization.manage"] },
					}),
			),
		);
		expect(Exit.isSuccess(exit) && exit.value.name).toBe("Acme Corp");
	});

	it("refuses a member without the permission", () => {
		const exit = run(
			scenario(
				(id) =>
					new UserActor({
						userId: "bob",
						permissions: { [id]: ["organization.read"] },
					}),
			),
		);
		expect(
			Exit.isFailure(exit) &&
				Option.getOrUndefined(Exit.findErrorOption(exit)) instanceof
					AccessDeniedError,
		).toBe(true);
	});
});
