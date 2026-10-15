import { Effect } from "effect";
import { AccessDeniedError } from "./access-denied-error.ts";
import {
	checked,
	type PermissionRef,
	permissionRef,
} from "./permission-ref.ts";

/**
 * A use case's baseline: who may call it at all, decided from its input alone
 * (the actor and the ids it names), before anything is loaded. A rule that
 * reads the loaded aggregate stays in the aggregate.
 *
 * A gate needs no service: the facts it decides on travel with the actor,
 * resolved once when the session is. That keeps every gate a pure function a
 * read model can ask too, and lets a catalogue list the permissions from the
 * declarations rather than from the bodies.
 */
export interface Gate<
	in I,
	out E extends AccessDeniedError = AccessDeniedError,
> {
	readonly label: string;
	readonly permissions: ReadonlyArray<PermissionRef>;
	readonly check: (input: I) => Effect.Effect<void, E>;
}

/** A gate that lets everyone through: its use case never fails with `AccessDeniedError`. */
export type OpenGate<I> = Gate<I, never>;

const ANYONE = [permissionRef("actor", "anyone")];

function open<I>(label: string): OpenGate<I> {
	return {
		label,
		permissions: ANYONE,
		check: () => checked(ANYONE)(Effect.void),
	};
}

export const Gate = {
	/**
	 * A gate from its check. The permissions are recorded on the span before
	 * the check runs, so a trace shows what was asked even when it was refused.
	 */
	make: <I, E extends AccessDeniedError = AccessDeniedError>(options: {
		readonly label: string;
		readonly permissions: ReadonlyArray<PermissionRef>;
		readonly check: (input: I) => Effect.Effect<void, E>;
	}): Gate<I, E> => ({
		label: options.label,
		permissions: options.permissions,
		check: (input) => checked(options.permissions)(options.check(input)),
	}),

	/** A gate from a predicate: refuses with `AccessDeniedError` when it is false. */
	when: <I>(options: {
		readonly label: string;
		readonly permissions: ReadonlyArray<PermissionRef>;
		readonly allows: (input: I) => boolean;
	}): Gate<I> =>
		Gate.make({
			label: options.label,
			permissions: options.permissions,
			check: (input) =>
				options.allows(input)
					? Effect.void
					: Effect.fail(new AccessDeniedError()),
		}),

	/** Everyone, before any session exists: a public read, a sign-up. */
	anyone: <I>(): OpenGate<I> => open("anyone"),

	/**
	 * Anyone holding the credential the input carries — a session token, an
	 * exchange code, a signed link. The body verifies it; the gate names it, so
	 * the catalogue reads "bearer of the exchange code" rather than "anyone".
	 */
	bearer: <I>(credential: string): OpenGate<I> =>
		open(`bearer of ${credential}`),

	/** Any one of the gates passing is enough. */
	either: <I>(...gates: ReadonlyArray<Gate<I>>): Gate<I> => ({
		label: gates.map((gate) => gate.label).join(" or "),
		permissions: gates.flatMap((gate) => gate.permissions),
		check: (input) =>
			gates.reduce<Effect.Effect<void, AccessDeniedError>>(
				(attempt, gate) => Effect.catch(attempt, () => gate.check(input)),
				Effect.fail(new AccessDeniedError()),
			),
	}),

	/** Every one of the gates must pass. */
	all: <I>(...gates: ReadonlyArray<Gate<I>>): Gate<I> => ({
		label: gates.map((gate) => gate.label).join(" and "),
		permissions: gates.flatMap((gate) => gate.permissions),
		check: (input) =>
			Effect.forEach(gates, (gate) => gate.check(input), { discard: true }),
	}),
};

/** Whether the gate lets `input` through, for a read model that shows or hides an action. */
export function gateHolds<I>(
	gate: Gate<I, AccessDeniedError>,
	input: I,
): Effect.Effect<boolean> {
	return gate.check(input).pipe(
		Effect.as(true),
		Effect.catch(() => Effect.succeed(false)),
	);
}
