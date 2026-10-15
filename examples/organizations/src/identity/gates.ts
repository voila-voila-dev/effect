import { Gate, permissionRef } from "@voila.dev/effect-ddd";
import { type Actor, UserActor } from "./actor.ts";
import type { Permission } from "./permission.ts";

interface WithActor {
	readonly actor: Actor;
}

/** Any signed-in user: what creating an organization asks. */
export function signedIn<I extends WithActor>() {
	return Gate.when<I>({
		label: "signed in",
		permissions: [permissionRef("actor", "user")],
		allows: ({ actor }) => actor instanceof UserActor,
	});
}

/** A member of the organization the payload names, holding `permission`. */
export function member<
	I extends WithActor & {
		readonly payload: { readonly organizationId: string };
	},
>(permission: Permission) {
	return Gate.when<I>({
		label: `member with ${permission}`,
		permissions: [permissionRef("organization", permission)],
		allows: ({ actor, payload }) =>
			actor instanceof UserActor &&
			(actor.permissions[payload.organizationId]?.includes(permission) ??
				false),
	});
}
