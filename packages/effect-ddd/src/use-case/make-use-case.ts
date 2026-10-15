import { Effect } from "effect";
import type { AccessDeniedError } from "../access-denied-error.ts";
import { unitMetrics } from "../metrics/unit-metrics.ts";
import { actorKind } from "./actor-kind.ts";
import type { UnitInput, UseCase, UseCaseDeclaration } from "./use-case.ts";

export type SpanAttributes = Readonly<
	Record<string, string | number | boolean>
>;

export interface UseCaseConstructorOptions {
	/**
	 * Extra span attributes read from the input — the caller's user id, the
	 * tenant the payload names. Written before the gate runs, so a refused call
	 * carries them too. Leave an absent value out rather than writing `null`.
	 */
	readonly annotate?: (
		input: Readonly<Record<string, unknown>>,
	) => SpanAttributes;
}

/**
 * Builds the `UseCase.make` an application uses, with its own span attributes.
 * `UseCase` is this with none beyond the defaults.
 */
export function makeUseCaseConstructor(
	options: UseCaseConstructorOptions = {},
) {
	function make<
		Name extends string,
		I extends UnitInput,
		A,
		E,
		R,
		Denied extends AccessDeniedError = AccessDeniedError,
	>(
		declaration: UseCaseDeclaration<Name, I, A, E, R, Denied>,
	): UseCase<Name, I, A, E, R, Denied> {
		const metrics = unitMetrics("usecase", declaration.name);

		const execute = Effect.fn(declaration.name)((input: I["Type"]) =>
			Effect.gen(function* () {
				// Annotated before the gate: a denied call is the one worth reading back.
				yield* Effect.annotateCurrentSpan({
					use_case: declaration.name,
					"actor.kind": actorKind(input),
					...options.annotate?.(input),
				});
				yield* declaration.gate.check(input);
				return yield* declaration.execute(input);
			}).pipe(metrics.track, Effect.annotateLogs({ unit: declaration.name })),
		);

		return {
			name: declaration.name,
			Input: declaration.input,
			gate: declaration.gate,
			execute,
		};
	}

	return { make };
}
