import { Effect } from "effect";
import { AccessDeniedError } from "../access-denied-error.ts";
import type { Gate } from "./gate.ts";

function joinLabels(gates: ReadonlyArray<Gate<never>>, word: string): string {
	return gates.map((gate) => gate.label).join(` ${word} `);
}

/** Any one of the gates passing is enough. */
export function either<I>(...gates: ReadonlyArray<Gate<I>>): Gate<I> {
	return {
		label: joinLabels(gates, "or"),
		permissions: gates.flatMap((gate) => gate.permissions),
		check: (input) =>
			gates.reduce<Effect.Effect<void, AccessDeniedError>>(
				(attempt, gate) => Effect.catch(attempt, () => gate.check(input)),
				Effect.fail(new AccessDeniedError()),
			),
	};
}

/** Every one of the gates must pass. */
export function all<I>(...gates: ReadonlyArray<Gate<I>>): Gate<I> {
	return {
		label: joinLabels(gates, "and"),
		permissions: gates.flatMap((gate) => gate.permissions),
		check: (input) =>
			Effect.forEach(gates, (gate) => gate.check(input), { discard: true }),
	};
}

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
