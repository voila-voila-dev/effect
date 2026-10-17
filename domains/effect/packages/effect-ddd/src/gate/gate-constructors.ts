import { Effect } from "effect";
import { AccessDeniedError } from "../access-denied-error.ts";
import {
	type PermissionRef,
	permissionRef,
} from "../permission/permission-ref.ts";
import { checked } from "../permission/permission-tracing.ts";
import type { Gate, OpenGate } from "./gate.ts";

/**
 * A gate from its check. The permissions are recorded on the span before the
 * check runs, so a trace shows what was asked even when it was refused.
 */
export function makeGate<
	I,
	E extends AccessDeniedError = AccessDeniedError,
>(options: {
	readonly label: string;
	readonly permissions: ReadonlyArray<PermissionRef>;
	readonly check: (input: I) => Effect.Effect<void, E>;
}): Gate<I, E> {
	return {
		label: options.label,
		permissions: options.permissions,
		check: (input) => checked(options.permissions)(options.check(input)),
	};
}

/** A gate from a predicate: refuses with `AccessDeniedError` when it is false. */
export function gateWhen<I>(options: {
	readonly label: string;
	readonly permissions: ReadonlyArray<PermissionRef>;
	readonly allows: (input: I) => boolean;
}): Gate<I> {
	return makeGate({
		label: options.label,
		permissions: options.permissions,
		check: (input) =>
			options.allows(input)
				? Effect.void
				: Effect.fail(new AccessDeniedError()),
	});
}

const ANYONE = [permissionRef("actor", "anyone")];

function openGate<I>(label: string): OpenGate<I> {
	return makeGate<I, never>({
		label,
		permissions: ANYONE,
		check: () => Effect.void,
	});
}

/** Everyone, before any session exists: a public read, a sign-up. */
export function anyone<I>(): OpenGate<I> {
	return openGate("anyone");
}

/**
 * Anyone holding the credential the input carries — a session token, an
 * exchange code, a signed link. The body verifies it; the gate names it, so the
 * catalogue reads "bearer of the exchange code" rather than "anyone".
 */
export function bearer<I>(credential: string): OpenGate<I> {
	return openGate(`bearer of ${credential}`);
}
