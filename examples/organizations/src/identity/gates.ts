import { Gate, permissionRef } from "@voila.dev/effect-ddd";
import { type Actor, UserActor } from "./actor.ts";
import type { Permission } from "./permission.ts";

interface WithActor {
	readonly actor: Actor;
}

interface WithOrganization extends WithActor {
	readonly payload: { readonly organizationId: string };
}

function holds(actor: Actor, organizationId: string, permission: Permission) {
	return (
		actor instanceof UserActor &&
		(actor.permissions[organizationId]?.includes(permission) ?? false)
	);
}

/** Any signed-in user. */
export function signedIn<I extends WithActor>() {
	return Gate.when<I>({
		label: "signed in",
		permissions: [permissionRef("actor", "user")],
		allows: ({ actor }) => actor instanceof UserActor,
	});
}

/** A member of the organization the payload names, holding `permission`. */
export function member<I extends WithOrganization>(permission: Permission) {
	return Gate.when<I>({
		label: `member with ${permission}`,
		permissions: [permissionRef("organization", permission)],
		allows: ({ actor, payload }) =>
			holds(actor, payload.organizationId, permission),
	});
}
