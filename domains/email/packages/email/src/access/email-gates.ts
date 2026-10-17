import { Gate, permissionRef } from "@voila.dev/effect-ddd";
import { type EmailActor, EmailOperator, EmailSystem } from "./email-actor.ts";
import type { EmailPermission } from "./email-permission.ts";

interface WithActor {
	readonly actor: EmailActor;
}

/** The process itself: a sweep, a webhook. */
export function system<I extends WithActor>() {
	return Gate.when<I>({
		label: "system",
		permissions: [permissionRef("actor", "system")],
		allows: ({ actor }) => actor instanceof EmailSystem,
	});
}

/** An operator holding `permission`. */
export function operatorWith<I extends WithActor>(permission: EmailPermission) {
	return Gate.when<I>({
		label: `operator with ${permission}`,
		permissions: [permissionRef("email", permission)],
		allows: ({ actor }) =>
			actor instanceof EmailOperator && actor.permissions.includes(permission),
	});
}

/** An operator holding `permission`, or the process itself. */
export function operatorWithOrSystem<I extends WithActor>(
	permission: EmailPermission,
) {
	return Gate.either<I>(operatorWith<I>(permission), system<I>());
}
