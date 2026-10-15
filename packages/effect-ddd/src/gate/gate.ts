import type { Effect } from "effect";
import type { AccessDeniedError } from "../access-denied-error.ts";
import type { PermissionRef } from "../permission/permission-ref.ts";
import { all, either } from "./gate-combinators.ts";
import { anyone, bearer, gateWhen, makeGate } from "./gate-constructors.ts";

/**
 * A use case's baseline: who may call it at all, decided from its input alone
 * (the actor and the ids it names), before anything is loaded. A rule that
 * reads the loaded aggregate stays in the aggregate.
 *
 * A gate needs no service: the facts it decides on travel with the actor,
 * resolved once with the session. That keeps every gate a pure function a
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

/** The gate constructors and combinators, under one name: `Gate.when(…)`, `Gate.either(…)`. */
export const Gate = {
	make: makeGate,
	when: gateWhen,
	anyone,
	bearer,
	either,
	all,
} as const;
