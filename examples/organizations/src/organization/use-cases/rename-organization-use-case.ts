import { makeAggregateActions, UseCase } from "@voila.dev/effect-ddd";
import { Schema } from "effect";
import { Actor } from "../../identity/actor.ts";
import { member } from "../../identity/gates.ts";
import { OrganizationNotFoundError } from "../organization-not-found-error.ts";
import { OrganizationRepositoryService } from "../organization-repository-service.ts";

const Input = Schema.Struct({
	actor: Actor,
	payload: Schema.Struct({
		organizationId: Schema.String,
		name: Schema.String,
	}),
});

const organizations = makeAggregateActions({
	repository: OrganizationRepositoryService,
	load: (repository, id: string) => repository.get(id),
	notFoundError: (organizationId) =>
		new OrganizationNotFoundError({ organizationId }),
	save: (repository, organization) => repository.save(organization),
});

export const RenameOrganizationUseCase = UseCase.make({
	name: "organization.rename-organization",
	input: Input,
	gate: member<typeof Input.Type>("organization.manage"),
	execute: ({ actor, payload }) =>
		organizations.transition(actor, payload.organizationId, (organization) =>
			organization.rename(payload.name),
		),
});
