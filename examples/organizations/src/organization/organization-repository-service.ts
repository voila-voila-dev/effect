import { Context, Effect, Layer, Option } from "effect";
import type { Organization } from "./organization.ts";

export class OrganizationRepositoryService extends Context.Service<
	OrganizationRepositoryService,
	{
		readonly get: (id: string) => Effect.Effect<Option.Option<Organization>>;
		readonly save: (organization: Organization) => Effect.Effect<Organization>;
	}
>()("OrganizationRepositoryService") {}

/** The adapter the tests run on; a real one would be Postgres, in its own package. */
export function inMemoryOrganizationRepository() {
	const rows = new Map<string, Organization>();
	return Layer.succeed(OrganizationRepositoryService, {
		get: (id) => Effect.sync(() => Option.fromNullishOr(rows.get(id))),
		save: (organization) =>
			Effect.sync(() => {
				rows.set(organization.id, organization);
				return organization;
			}),
	});
}
