import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { Actor, UserActor } from "../../identity/actor.ts";
import { signedIn } from "../../identity/gates.ts";
import { Organization } from "../organization.ts";
import { OrganizationRepositoryService } from "../organization-repository-service.ts";

const Input = Schema.Struct({
	actor: Actor,
	payload: Schema.Struct({ name: Schema.String }),
});

export const CreateOrganizationUseCase = UseCase.make({
	name: "organization.create-organization",
	input: Input,
	gate: signedIn<typeof Input.Type>(),
	execute: ({ actor, payload }) =>
		Effect.gen(function* () {
			const repository = yield* OrganizationRepositoryService;
			const organization = yield* Organization.create({
				id: crypto.randomUUID(),
				name: payload.name,
				// The gate let only a user through.
				ownerId: actor instanceof UserActor ? actor.userId : "",
			});
			return yield* repository.save(organization);
		}),
});
