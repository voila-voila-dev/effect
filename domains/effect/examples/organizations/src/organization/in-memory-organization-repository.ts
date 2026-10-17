import { Effect, Layer, Option } from "effect";
import type { Organization } from "./organization.ts";
import { OrganizationRepositoryService } from "./organization-repository-service.ts";

/** The adapter the tests run on; a real one (Postgres) would live in the infrastructure layer. */
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
