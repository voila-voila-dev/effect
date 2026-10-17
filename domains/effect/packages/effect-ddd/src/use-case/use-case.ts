import type { Effect, Schema } from "effect";
import type { AccessDeniedError } from "../access-denied-error.ts";
import type { Gate } from "../gate/gate.ts";
import { makeUseCaseConstructor } from "./make-use-case.ts";

/**
 * A use case's input is a struct. By convention it is
 * `{ actor, payload: { … } }`: who calls, and what they ask for. A flow that
 * runs before a session exists (login, a redeemed link) has no actor and
 * compiles only under an open gate (`Gate.anyone`, `Gate.bearer`).
 */
export type UnitInput = Schema.Struct<Schema.Struct.Fields>;

/**
 * One piece of behaviour the application offers, declared in one place: its
 * name, what it takes, who may call it, and what it does.
 *
 * The gate is a field rather than the first line of the body, so a read model
 * can ask the same question (`gateHolds`) and a permissions catalogue can be
 * built from the declarations.
 */
export interface UseCase<
	Name extends string,
	I extends UnitInput,
	A,
	E,
	R,
	Denied extends AccessDeniedError = AccessDeniedError,
> {
	readonly name: Name;
	readonly Input: I;
	readonly gate: Gate<I["Type"], Denied>;
	/** Fails with `AccessDeniedError` only when the gate can deny: an open gate's use case does not carry it. */
	readonly execute: (input: I["Type"]) => Effect.Effect<A, E | Denied, R>;
}

/** `UseCase.make(…)`, with the default span attributes. */
export const UseCase = makeUseCaseConstructor();

/**
 * A use case whatever its input, result, error and requirements — what a list
 * of heterogeneous use cases erases each entry to.
 */
export type AnyUseCase = UseCase<
	string,
	// biome-ignore lint/suspicious/noExplicitAny: the input appears in `gate` and `execute` as a parameter, so a common supertype would reject every use case; a registry reads neither.
	any,
	// biome-ignore lint/suspicious/noExplicitAny: the existential a registry erases each use case to.
	any,
	// biome-ignore lint/suspicious/noExplicitAny: same existential, for the error channel.
	any,
	// biome-ignore lint/suspicious/noExplicitAny: same existential, for the requirements channel.
	any,
	// biome-ignore lint/suspicious/noExplicitAny: same existential, for whether the gate can deny.
	any
>;

/** What `UseCase.make` takes. */
export interface UseCaseDeclaration<
	Name extends string,
	I extends UnitInput,
	A,
	E,
	R,
	Denied extends AccessDeniedError,
> {
	readonly name: Name;
	readonly input: I;
	readonly gate: Gate<I["Type"], Denied>;
	readonly execute: (input: I["Type"]) => Effect.Effect<A, E, R>;
}
