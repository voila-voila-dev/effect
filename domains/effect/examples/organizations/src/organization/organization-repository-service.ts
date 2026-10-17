import { Context, type Effect, type Option } from "effect";
import type { Organization } from "./organization.ts";

/** Where organizations are kept. The domain names the contract; adapters implement it. */
export class OrganizationRepositoryService extends Context.Service<
	OrganizationRepositoryService,
	{
		readonly get: (id: string) => Effect.Effect<Option.Option<Organization>>;
		readonly save: (organization: Organization) => Effect.Effect<Organization>;
	}
>()("OrganizationRepositoryService") {}
